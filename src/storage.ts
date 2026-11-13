import type { ChatMessage, QuizAttempt, StudyNote } from './types';

const NOTES_KEY = 'studyloop_notes_v1';
const HISTORY_KEY = 'studyloop_history_v1';
const CHAT_KEY = 'studyloop_chat_v1';

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadNotes(): StudyNote[] {
  const notes = safeRead<StudyNote[]>(NOTES_KEY, []);
  return Array.isArray(notes) ? notes : [];
}

export function saveNotes(notes: StudyNote[]): void {
  safeWrite(NOTES_KEY, notes);
}

export function loadHistory(): QuizAttempt[] {
  const history = safeRead<QuizAttempt[]>(HISTORY_KEY, []);
  return Array.isArray(history) ? history : [];
}

export function saveHistory(history: QuizAttempt[]): void {
  safeWrite(HISTORY_KEY, history);
}

export function loadChatMessages(): ChatMessage[] {
  const messages = safeRead<ChatMessage[]>(CHAT_KEY, []);
  return Array.isArray(messages) ? messages : [];
}

export function saveChatMessages(messages: ChatMessage[]): void {
  safeWrite(CHAT_KEY, messages);
}
