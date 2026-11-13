import { useRef, useState } from 'react';
import { BookOpen, Edit3, MessageSquareText, Plus, Search, Sparkles, Trash2, Upload } from 'lucide-react';
import type { StudyNote } from '../types';

interface MaterialsViewProps {
  notes: StudyNote[];
  onSaveNote: (noteData: {
    id?: string;
    title: string;
    content: string;
    source: 'pasted' | 'uploaded';
  }) => void;
  onDeleteNote: (id: string) => void;
  onGenerateQuizFromNote: (noteId: string) => void;
  onAskAssistantForNote: (noteId: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function MaterialsView({
  notes,
  onSaveNote,
  onDeleteNote,
  onGenerateQuizFromNote,
  onAskAssistantForNote,
}: MaterialsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState<'pasted' | 'uploaded'>('pasted');
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setSource('pasted');
    setFormError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    setStatusMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') {
      setFormError('Please select a plain text (.txt) file.');
      e.target.value = '';
      return;
    }

    if (file.size > 1_000_000) {
      setFormError('File is too large. Please keep .txt study files under 1 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result.trim() : '';
      if (!text) {
        setFormError('The uploaded .txt file is empty.');
        return;
      }
      const cleanName = file.name.replace(/\.txt$/i, '');
      setTitle(cleanName);
      setContent(text);
      setSource('uploaded');
      setStatusMessage(`Loaded "${file.name}". Click Save Study Note to store it.`);
    };
    reader.onerror = () => {
      setFormError('Could not read the selected file.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStatusMessage(null);

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle) {
      setFormError('Please enter a title for your study notes.');
      return;
    }
    if (cleanContent.length < 20) {
      setFormError('Study notes must contain at least 20 characters.');
      return;
    }

    onSaveNote({
      id: editingId ?? undefined,
      title: cleanTitle,
      content: cleanContent,
      source,
    });

    setStatusMessage(editingId ? 'Study note updated.' : 'Study note saved to your library.');
    resetForm();
  };

  const handleStartEdit = (note: StudyNote) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSource(note.source);
    setFormError(null);
    setStatusMessage(null);
  };

  const filteredNotes = notes.filter((note) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            {editingId ? 'Edit Study Note' : 'Add Study Notes'}
          </h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileUpload}
              className="hidden"
              id="txt-file-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5 text-violet-600" />
              <span>Upload .txt</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="note-title" className="block text-xs font-medium text-slate-700">
              Topic or Title
            </label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Cellular Respiration & ATP Synthesis"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="note-content" className="block text-xs font-medium text-slate-700">
                Study Notes
              </label>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                {wordCount} words
              </span>
            </div>
            <textarea
              id="note-content"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your lecture notes, textbook summary, or key definitions here..."
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
            >
              {formError}
            </div>
          )}

          {statusMessage && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-medium text-blue-800">
              {statusMessage}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>{editingId ? 'Save Changes' : 'Save Study Note'}</span>
            </button>

            {(editingId || title || content) && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-4 lg:col-span-7">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Saved Study Library
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              {notes.length} {notes.length === 1 ? 'document' : 'documents'} stored in browser
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved notes..."
              aria-label="Search saved notes"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
            <BookOpen className="mx-auto h-9 w-9 text-slate-300" />
            <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
              Your study library is empty
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
              Paste your notes on the left or upload a .txt file to generate AI quizzes and ask study questions.
            </p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No notes match "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => {
              const words = note.content.trim().split(/\s+/).filter(Boolean).length;
              const isExpanded = expandedId === note.id;
              const isConfirmingDelete = confirmDeleteId === note.id;

              return (
                <article
                  key={note.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        {note.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 tabular-nums">
                        {note.source === 'uploaded' ? 'TXT upload' : 'Pasted'} · {words} words ·{' '}
                        {formatDate(note.updatedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onGenerateQuizFromNote(note.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Generate Quiz</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAskAssistantForNote(note.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        <MessageSquareText className="h-3.5 w-3.5 text-violet-600" />
                        <span>Ask AI</span>
                      </button>
                    </div>
                  </div>

                  <p
                    className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 ${
                      isExpanded ? '' : 'line-clamp-3'
                    }`}
                  >
                    {note.content}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : note.id)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {isExpanded ? 'Show less' : 'Read full note'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(note)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteNote(note.id);
                              setConfirmDeleteId(null);
                              if (editingId === note.id) resetForm();
                            }}
                            className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(note.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
