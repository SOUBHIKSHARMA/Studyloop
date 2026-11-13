import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type {
  ActiveView,
  QuizAttempt,
  QuizCount,
  QuizDifficulty,
  QuizQuestion,
  StudyNote,
} from '../types';

interface QuizViewProps {
  notes: StudyNote[];
  preselectedNoteId: string | null;
  onSaveAttempt: (attempt: QuizAttempt) => void;
  onNavigate: (view: ActiveView) => void;
}

type QuizPhase = 'setup' | 'active' | 'results';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function QuizView({
  notes,
  preselectedNoteId,
  onSaveAttempt,
  onNavigate,
}: QuizViewProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    preselectedNoteId || (notes[0]?.id ?? 'all')
  );
  const [questionCount, setQuestionCount] = useState<QuizCount>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Medium');

  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quizTopic, setQuizTopic] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (preselectedNoteId && notes.some((n) => n.id === preselectedNoteId)) {
      setSelectedNoteId(preselectedNoteId);
    } else if (
      selectedNoteId !== 'all' &&
      !notes.some((n) => n.id === selectedNoteId)
    ) {
      setSelectedNoteId(notes[0]?.id ?? 'all');
    }
  }, [preselectedNoteId, notes, selectedNoteId]);

  const handleGenerateQuiz = async () => {
    setError(null);

    if (notes.length === 0) {
      setError('Please add study notes before generating a quiz.');
      return;
    }

    let topic = 'All Study Materials';
    let notesText = '';

    if (selectedNoteId === 'all') {
      notesText = notes
        .map((n) => `## ${n.title}\n${n.content}`)
        .join('\n\n');
    } else {
      const found = notes.find((n) => n.id === selectedNoteId);
      if (!found) {
        setError('Selected study note was not found.');
        return;
      }
      topic = found.title;
      notesText = found.content;
    }

    if (notesText.trim().length < 20) {
      setError('Selected study notes are too short to generate a quiz.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          notesText,
          count: questionCount,
          difficulty,
        }),
      });

      const data = (await response.json()) as {
        questions?: QuizQuestion[];
        error?: string;
      };

      if (!response.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(data.error || 'Failed to generate quiz questions.');
      }

      setQuizTopic(topic);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setLastAttempt(null);
      setPhase('active');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to generate quiz. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    const total = questions.length;
    let correctCount = 0;

    for (const q of questions) {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    }

    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const attempt: QuizAttempt = {
      id: `quiz-${Date.now()}`,
      topic: quizTopic,
      noteId: selectedNoteId,
      difficulty,
      totalQuestions: total,
      correctCount,
      percentage,
      createdAt: new Date().toISOString(),
      questions,
      selectedAnswers: { ...selectedAnswers },
    };

    onSaveAttempt(attempt);
    setLastAttempt(attempt);
    setPhase('results');
  };

  const handleRetrySameQuiz = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setLastAttempt(null);
    setPhase('active');
  };

  const handleResetToSetup = () => {
    setPhase('setup');
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setLastAttempt(null);
    setError(null);
  };

  if (notes.length === 0 && phase === 'setup') {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-4 font-display text-lg font-semibold text-slate-900">
          Add study notes to generate a quiz
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          StudyLoop builds custom multiple-choice quizzes directly from your saved notes. Paste or upload a .txt file first.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('materials')}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
        >
          <span>Go to Study Materials</span>
        </button>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Configure AI Quiz
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select your study material, question count, and difficulty level.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="quiz-note-select"
                className="block text-xs font-medium text-slate-700"
              >
                Study Material
              </label>
              <select
                id="quiz-note-select"
                value={selectedNoteId}
                onChange={(e) => setSelectedNoteId(e.target.value)}
                disabled={isGenerating}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              >
                {notes.map((note) => {
                  const words = note.content.trim().split(/\s+/).filter(Boolean).length;
                  return (
                    <option key={note.id} value={note.id}>
                      {note.title} ({words} words)
                    </option>
                  );
                })}
                {notes.length > 1 && (
                  <option value="all">
                    All Saved Notes ({notes.length} documents)
                  </option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <span className="block text-xs font-medium text-slate-700">
                  Number of Questions
                </span>
                <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                  {([5, 10, 15] as QuizCount[]).map((count) => (
                    <button
                      key={count}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setQuestionCount(count)}
                      className={`rounded-md py-2 font-mono text-xs font-semibold transition-colors tabular-nums ${
                        questionCount === count
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {count} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700">
                  Difficulty Level
                </span>
                <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                  {(['Easy', 'Medium', 'Hard'] as QuizDifficulty[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setDifficulty(level)}
                      className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                        difficulty === level
                          ? 'bg-white text-violet-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateQuiz}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating {questionCount} {difficulty} Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Quiz</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (phase === 'active') {
    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(selectedAnswers).length;
    const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);
    const chosenOption = selectedAnswers[currentQuestion.id];

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {quizTopic} · {difficulty}
              </p>
              <h2 className="mt-0.5 font-display text-base font-semibold text-slate-900 tabular-nums">
                Question {currentIndex + 1} of {questions.length}
              </h2>
            </div>
            <p className="font-mono text-xs text-slate-500 tabular-nums">
              {answeredCount}/{questions.length} answered
            </p>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Question navigator">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = selectedAnswers[q.id] !== undefined;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-8 w-8 rounded-md font-mono text-xs font-medium transition-colors tabular-nums ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isAnswered
                        ? 'bg-violet-50 text-violet-700 border border-violet-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-lg font-semibold leading-snug text-slate-900">
            {currentQuestion.question}
          </h3>

          <div className="mt-5 space-y-2.5">
            {currentQuestion.options.map((optionText, idx) => {
              const isSelected = chosenOption === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion.id, idx)}
                  className={`flex w-full items-start gap-3.5 rounded-lg border px-4 py-3.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {OPTION_LETTERS[idx]}
                  </span>
                  <span className="leading-relaxed">{optionText}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3">
              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-medium text-white hover:opacity-95"
                >
                  <span>Submit Quiz</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Results phase
  const attempt = lastAttempt;
  if (!attempt) return null;

  const incorrectCount = attempt.totalQuestions - attempt.correctCount;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Quiz Complete · {attempt.topic} · {attempt.difficulty}
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-mono text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
                {attempt.percentage}%
              </span>
              <span className="font-mono text-sm font-medium text-slate-600 tabular-nums">
                {attempt.correctCount} of {attempt.totalQuestions} correct
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRetrySameQuiz}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Quiz</span>
            </button>
            <button
              type="button"
              onClick={handleResetToSetup}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <span>New Quiz</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Correct Answers</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-lg font-semibold text-emerald-700 tabular-nums">
              <CheckCircle2 className="h-4 w-4" />
              <span>{attempt.correctCount}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Incorrect Answers</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-lg font-semibold text-rose-700 tabular-nums">
              <XCircle className="h-4 w-4" />
              <span>{incorrectCount}</span>
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-500">Saved to History</p>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View Quiz History →
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-base font-semibold text-slate-900">
          Answer Breakdown & Explanations
        </h3>

        {attempt.questions.map((q, idx) => {
          const userChoice = attempt.selectedAnswers[q.id];
          const isCorrect = userChoice === q.correctIndex;
          const isUnanswered = userChoice === undefined;

          return (
            <article
              key={q.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-display text-sm font-semibold leading-snug text-slate-900">
                  <span className="mr-1.5 font-mono text-slate-400 tabular-nums">
                    {idx + 1}.
                  </span>
                  {q.question}
                </h4>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold whitespace-nowrap ${
                    isCorrect ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Correct</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>{isUnanswered ? 'Unanswered' : 'Incorrect'}</span>
                    </>
                  )}
                </span>
              </div>

              <div className="mt-3.5 space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isCorrectOption = optIdx === q.correctIndex;
                  const isUserPick = optIdx === userChoice;

                  let rowStyle = 'border-slate-200 bg-slate-50/50 text-slate-700';
                  if (isCorrectOption) {
                    rowStyle = 'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium';
                  } else if (isUserPick && !isCorrectOption) {
                    rowStyle = 'border-rose-300 bg-rose-50 text-rose-950';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${rowStyle}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-xs font-semibold">
                          {OPTION_LETTERS[optIdx]}.
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isCorrectOption && (
                        <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
                          Correct answer
                        </span>
                      )}
                      {isUserPick && !isCorrectOption && (
                        <span className="text-xs font-semibold text-rose-700 whitespace-nowrap">
                          Your answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-3.5 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">Explanation: </span>
                {q.explanation}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
