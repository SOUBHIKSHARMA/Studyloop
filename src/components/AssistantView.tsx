import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Loader2,
  MessageSquareText,
  Send,
  Trash2,
} from 'lucide-react';
import type { ActiveView, ChatMessage, StudyNote } from '../types';

interface AssistantViewProps {
  notes: StudyNote[];
  messages: ChatMessage[];
  preselectedNoteId: string | null;
  onUpdateMessages: (messages: ChatMessage[]) => void;
  onNavigate: (view: ActiveView) => void;
}

const STARTER_PROMPTS = [
  'Summarize the key concepts from my notes in bullet points.',
  'List the most important terms and definitions I should memorize.',
  'What are common misconceptions or tricky points in these notes?',
];

export function AssistantView({
  notes,
  messages,
  preselectedNoteId,
  onUpdateMessages,
  onNavigate,
}: AssistantViewProps) {
  const [selectedScope, setSelectedScope] = useState<string>(
    preselectedNoteId || 'all'
  );
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (preselectedNoteId && notes.some((n) => n.id === preselectedNoteId)) {
      setSelectedScope(preselectedNoteId);
    } else if (
      selectedScope !== 'all' &&
      !notes.some((n) => n.id === selectedScope)
    ) {
      setSelectedScope('all');
    }
  }, [preselectedNoteId, notes, selectedScope]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const sendMessage = async (textToSend?: string) => {
    const cleanText = (textToSend ?? input).trim();
    if (!cleanText || isSending) return;

    setError(null);

    if (notes.length === 0) {
      setError('Add study notes first so the AI assistant can reference your material.');
      return;
    }

    const notesContext =
      selectedScope === 'all'
        ? notes.map((n) => ({ title: n.title, content: n.content }))
        : notes
            .filter((n) => n.id === selectedScope)
            .map((n) => ({ title: n.title, content: n.content }));

    if (notesContext.length === 0) {
      setError('Selected note could not be found.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      text: cleanText,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    onUpdateMessages(nextMessages);
    if (!textToSend) setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, text: m.text })),
          notesContext,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Failed to get a response from the AI assistant.');
      }

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-m`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toISOString(),
      };
      onUpdateMessages([...nextMessages, modelMsg]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reach the AI assistant. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  if (notes.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-4 font-display text-lg font-semibold text-slate-900">
          Add study materials to chat with your notes
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          The AI Study Assistant answers questions grounded directly in your saved notes. Paste or upload notes to begin.
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

  return (
    <div className="mx-auto flex h-[calc(100vh-11rem)] min-h-[520px] max-w-4xl flex-col rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <label htmlFor="assistant-scope" className="text-xs font-medium text-slate-600">
            Reference Notes:
          </label>
          <select
            id="assistant-scope"
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
          >
            <option value="all">All Saved Notes ({notes.length})</option>
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onUpdateMessages([]);
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <MessageSquareText className="h-9 w-9 text-violet-500" />
            <h2 className="mt-3 font-display text-base font-semibold text-slate-900">
              Ask anything about your study notes
            </h2>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Get explanations, summaries, and practice breakdowns grounded in your saved material.
            </p>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span>Reviewing your notes...</span>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
        className="border-t border-slate-200 p-4"
      >
        <div className="flex items-end gap-3">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your notes... (Enter to send)"
            disabled={isSending}
            className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Send message"
            className="inline-flex h-[42px] items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
