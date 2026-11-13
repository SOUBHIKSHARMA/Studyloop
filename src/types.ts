export type ActiveView = 'dashboard' | 'materials' | 'quiz' | 'history' | 'assistant';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';
export type QuizCount = 5 | 10 | 15;

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  source: 'pasted' | 'uploaded';
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  topic: string;
  noteId: string;
  difficulty: QuizDifficulty;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  createdAt: string;
  questions: QuizQuestion[];
  selectedAnswers: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
