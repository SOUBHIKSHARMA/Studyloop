import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface RawQuizQuestion {
  question?: unknown;
  options?: unknown;
  correctIndex?: unknown;
  explanation?: unknown;
}

interface ValidatedQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

function validateQuizPayload(rawText: string, expectedCount: number): ValidatedQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Gemini returned invalid JSON for the quiz.');
  }

  const rawQuestions =
    parsed && typeof parsed === 'object' && Array.isArray((parsed as { questions?: unknown }).questions)
      ? ((parsed as { questions: RawQuizQuestion[] }).questions)
      : Array.isArray(parsed)
        ? (parsed as RawQuizQuestion[])
        : null;

  if (!rawQuestions || rawQuestions.length === 0) {
    throw new Error('Quiz generation returned no questions.');
  }

  const validated: ValidatedQuestion[] = [];
  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];
    if (!q || typeof q !== 'object') continue;

    const questionText = typeof q.question === 'string' ? q.question.trim() : '';
    const explanationText = typeof q.explanation === 'string' ? q.explanation.trim() : '';
    const optionsArr = Array.isArray(q.options)
      ? q.options.map((opt) => (typeof opt === 'string' ? opt.trim() : '')).filter(Boolean)
      : [];
    const correctIdx =
      typeof q.correctIndex === 'number' && Number.isInteger(q.correctIndex)
        ? q.correctIndex
        : -1;

    if (
      !questionText ||
      optionsArr.length !== 4 ||
      correctIdx < 0 ||
      correctIdx > 3 ||
      !explanationText
    ) {
      continue;
    }

    validated.push({
      id: `q-${i + 1}-${Date.now()}`,
      question: questionText,
      options: [optionsArr[0], optionsArr[1], optionsArr[2], optionsArr[3]],
      correctIndex: correctIdx,
      explanation: explanationText,
    });
  }

  if (validated.length === 0) {
    throw new Error('Generated questions did not meet the required 4-option MCQ format.');
  }

  return validated.slice(0, expectedCount);
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : 'An unexpected AI service error occurred.';
  if (msg.includes('GEMINI_API_KEY')) {
    return { status: 500, message: msg };
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'Gemini API authentication failed. Check your GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Rate limit reached on the Gemini API. Please wait a moment and try again.',
    };
  }
  return { status: 500, message: msg };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/quiz', async (req, res) => {
    try {
      const { topic, notesText, count, difficulty } = req.body as {
        topic?: string;
        notesText?: string;
        count?: number;
        difficulty?: string;
      };

      const cleanNotes = typeof notesText === 'string' ? notesText.trim() : '';
      if (cleanNotes.length < 20) {
        return res.status(400).json({
          error: 'Study notes are too short. Please provide at least 20 characters of notes.',
        });
      }

      const validCount = count === 5 || count === 10 || count === 15 ? count : 5;
      const validDifficulty =
        difficulty === 'Easy' || difficulty === 'Medium' || difficulty === 'Hard'
          ? difficulty
          : 'Medium';
      const cleanTopic =
        typeof topic === 'string' && topic.trim().length > 0 ? topic.trim() : 'Study Notes';

      const ai = getAiClient();

      const difficultyGuidance: Record<string, string> = {
        Easy: 'Focus on foundational recall, definitions, and key facts directly stated in the notes.',
        Medium: 'Focus on conceptual understanding, relationships between ideas, and practical application.',
        Hard: 'Focus on synthesis, subtle distinctions, edge cases, multi-step reasoning, and plausible distractors.',
      };

      const prompt = [
        `Topic: ${cleanTopic}`,
        `Question count: Exactly ${validCount} multiple-choice questions.`,
        `Difficulty: ${validDifficulty} (${difficultyGuidance[validDifficulty]})`,
        '',
        'Rules:',
        '- Base all questions, options, and explanations strictly on the provided study notes.',
        '- Every question must have exactly 4 distinct options.',
        '- Provide correctIndex as an integer from 0 to 3 pointing to the single best answer.',
        '- Vary correctIndex positions naturally across questions.',
        '- Provide a concise, educational explanation (1-2 sentences) clarifying why the correct answer is right.',
        '',
        'Study Notes:',
        '"""',
        cleanNotes.slice(0, 60000),
        '"""',
      ].join('\n');

      let questions: ValidatedQuestion[] | null = null;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              systemInstruction:
                'You are an expert educational assessment designer. Always return clean, valid JSON strictly matching the requested schema.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  questions: {
                    type: Type.ARRAY,
                    description: `List of exactly ${validCount} multiple-choice questions.`,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: {
                          type: Type.STRING,
                          description: 'Clear, self-contained question stem.',
                        },
                        options: {
                          type: Type.ARRAY,
                          description: 'Exactly 4 distinct answer choices.',
                          items: { type: Type.STRING },
                        },
                        correctIndex: {
                          type: Type.INTEGER,
                          description: '0-based index (0, 1, 2, or 3) of the correct option.',
                        },
                        explanation: {
                          type: Type.STRING,
                          description: 'Brief explanation citing the concept from the study notes.',
                        },
                      },
                      required: ['question', 'options', 'correctIndex', 'explanation'],
                    },
                  },
                },
                required: ['questions'],
              },
            },
          });

          const rawText = (response.text ?? '').trim();
          const parsedQuestions = validateQuizPayload(rawText, validCount);
          if (parsedQuestions.length < Math.min(validCount, 3) && attempt === 0) {
            continue;
          }
          questions = parsedQuestions;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!questions) {
        throw lastError instanceof Error
          ? lastError
          : new Error('Failed to generate a valid quiz from your notes.');
      }

      return res.json({ questions });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, notesContext } = req.body as {
        messages?: Array<{ role: 'user' | 'model'; text: string }>;
        notesContext?: Array<{ title: string; content: string }>;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Please enter a question.' });
      }

      const validNotes = Array.isArray(notesContext)
        ? notesContext.filter(
            (n) => n && typeof n.content === 'string' && n.content.trim().length > 0
          )
        : [];

      if (validNotes.length === 0) {
        return res.status(400).json({
          error: 'No study notes found. Add study materials first so the assistant can reference them.',
        });
      }

      const notesBlock = validNotes
        .map((n, idx) => `--- Note ${idx + 1}: ${n.title || 'Untitled'} ---\n${n.content.trim()}`)
        .join('\n\n')
        .slice(0, 60000);

      const ai = getAiClient();

      const contents = messages
        .filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0)
        .slice(-16)
        .map((m) => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text.trim() }],
        }));

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: [
            'You are StudyLoop, a focused, accurate AI study assistant.',
            "Answer the student's questions using their study notes below as your primary source of truth.",
            'When citing a concept, explain it clearly and concisely using headings or bullet points where helpful.',
            'If a question asks about something not covered in the provided study notes, explicitly state that it is not in their saved notes before offering any brief general context.',
            '',
            'STUDENT STUDY NOTES:',
            notesBlock,
          ].join('\n'),
        },
      });

      const reply = (response.text ?? '').trim();
      if (!reply) {
        throw new Error('The AI assistant returned an empty response.');
      }

      return res.json({ reply });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyLoop server running on http://localhost:${PORT}`);
  });
}

startServer();
