import { useState } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { AssistantView } from './components/AssistantView';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { MaterialsView } from './components/MaterialsView';
import { QuizView } from './components/QuizView';
import { Sidebar } from './components/Sidebar';
import {
  loadChatMessages,
  loadHistory,
  loadNotes,
  saveChatMessages,
  saveHistory,
  saveNotes,
} from './storage';
import type { ActiveView, ChatMessage, QuizAttempt, StudyNote } from './types';

const VIEW_TITLES: Record<ActiveView, string> = {
  dashboard: 'Dashboard',
  materials: 'Study Materials',
  quiz: 'AI Quiz Generator',
  history: 'Quiz History',
  assistant: 'AI Study Assistant',
};

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [notes, setNotes] = useState<StudyNote[]>(() => loadNotes());
  const [history, setHistory] = useState<QuizAttempt[]>(() => loadHistory());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    loadChatMessages()
  );

  const [preselectedQuizNoteId, setPreselectedQuizNoteId] = useState<string | null>(
    null
  );
  const [preselectedChatNoteId, setPreselectedChatNoteId] = useState<string | null>(
    null
  );
  const [inspectedAttemptId, setInspectedAttemptId] = useState<string | null>(null);

  const handleSaveNote = (noteData: {
    id?: string;
    title: string;
    content: string;
    source: 'pasted' | 'uploaded';
  }) => {
    const now = new Date().toISOString();
    let updatedNotes: StudyNote[];

    if (noteData.id) {
      updatedNotes = notes.map((n) =>
        n.id === noteData.id
          ? {
              ...n,
              title: noteData.title,
              content: noteData.content,
              source: noteData.source,
              updatedAt: now,
            }
          : n
      );
    } else {
      const newNote: StudyNote = {
        id: `note-${Date.now()}`,
        title: noteData.title,
        content: noteData.content,
        source: noteData.source,
        createdAt: now,
        updatedAt: now,
      };
      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter((n) => n.id !== id);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  const handleSaveAttempt = (attempt: QuizAttempt) => {
    const updatedHistory = [attempt, ...history];
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  };

  const handleDeleteAttempt = (id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const handleUpdateMessages = (nextMessages: ChatMessage[]) => {
    setChatMessages(nextMessages);
    saveChatMessages(nextMessages);
  };

  const handleStartQuizForNote = (noteId: string) => {
    setPreselectedQuizNoteId(noteId);
    setActiveView('quiz');
  };

  const handleAskAssistantForNote = (noteId: string) => {
    setPreselectedChatNoteId(noteId);
    setActiveView('assistant');
  };

  const handleInspectAttempt = (attemptId: string) => {
    setInspectedAttemptId(attemptId);
    setActiveView('history');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        notesCount={notes.length}
        historyCount={history.length}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display text-base font-semibold text-slate-900">
              {VIEW_TITLES[activeView]}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveView(notes.length === 0 ? 'materials' : 'quiz')
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{notes.length === 0 ? 'Add Notes' : 'New Quiz'}</span>
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {activeView === 'dashboard' && (
            <DashboardView
              notes={notes}
              history={history}
              onNavigate={setActiveView}
              onStartQuizForNote={handleStartQuizForNote}
              onInspectAttempt={handleInspectAttempt}
            />
          )}

          {activeView === 'materials' && (
            <MaterialsView
              notes={notes}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onGenerateQuizFromNote={handleStartQuizForNote}
              onAskAssistantForNote={handleAskAssistantForNote}
            />
          )}

          {activeView === 'quiz' && (
            <QuizView
              notes={notes}
              preselectedNoteId={preselectedQuizNoteId}
              onSaveAttempt={handleSaveAttempt}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'history' && (
            <HistoryView
              history={history}
              inspectedAttemptId={inspectedAttemptId}
              onDeleteAttempt={handleDeleteAttempt}
              onClearHistory={handleClearHistory}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'assistant' && (
            <AssistantView
              notes={notes}
              messages={chatMessages}
              preselectedNoteId={preselectedChatNoteId}
              onUpdateMessages={handleUpdateMessages}
              onNavigate={setActiveView}
            />
          )}
        </main>
      </div>
    </div>
  );
}
