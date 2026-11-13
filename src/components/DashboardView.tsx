import { ArrowRight, BookOpen, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import type { ActiveView, QuizAttempt, StudyNote } from '../types';

interface DashboardViewProps {
  notes: StudyNote[];
  history: QuizAttempt[];
  onNavigate: (view: ActiveView) => void;
  onStartQuizForNote: (noteId: string) => void;
  onInspectAttempt: (attemptId: string) => void;
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

export function DashboardView({
  notes,
  history,
  onNavigate,
  onStartQuizForNote,
  onInspectAttempt,
}: DashboardViewProps) {
  const totalQuizzes = history.length;
  const averageScore =
    totalQuizzes > 0
      ? Math.round(history.reduce((sum, item) => sum + item.percentage, 0) / totalQuizzes)
      : null;

  const totalWords = notes.reduce((sum, note) => {
    const words = note.content.trim().split(/\s+/).filter(Boolean).length;
    return sum + words;
  }, 0);

  const recentActivity = history.slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 text-balance">
              {notes.length === 0
                ? 'Start your study loop by adding notes'
                : 'Turn your notes into active recall'}
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              {notes.length === 0
                ? 'Paste lecture notes or upload a .txt file, then generate tailored multiple-choice quizzes and chat with your AI study assistant.'
                : `You have ${notes.length} saved ${notes.length === 1 ? 'note' : 'notes'} (${totalWords.toLocaleString()} words) ready for AI quiz generation or concept review.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {notes.length === 0 ? (
              <button
                type="button"
                onClick={() => onNavigate('materials')}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
              >
                <BookOpen className="h-4 w-4" />
                <span>Add Study Notes</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('quiz')}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate AI Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('assistant')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
                >
                  <span>Ask AI Assistant</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Study metrics">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Quizzes</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {totalQuizzes}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {totalQuizzes === 0 ? 'No quizzes completed yet' : 'Saved quiz attempts'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Average Score</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-blue-700 tabular-nums">
            {averageScore !== null ? `${averageScore}%` : '—'}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {averageScore !== null
              ? `Across ${totalQuizzes} completed ${totalQuizzes === 1 ? 'quiz' : 'quizzes'}`
              : 'Complete a quiz to calculate'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Study Materials</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-violet-700 tabular-nums">
            {notes.length}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {totalWords.toLocaleString()} total words saved
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Recent Activity
            </h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('history')}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                <span>View all history</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-800">No quiz attempts yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Generate a quiz from your study materials and submit it to track your scores here.
              </p>
              <button
                type="button"
                onClick={() => onNavigate(notes.length === 0 ? 'materials' : 'quiz')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <span>{notes.length === 0 ? 'Add Study Notes' : 'Create First Quiz'}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                    <th className="px-5 py-3">Topic</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map((attempt) => (
                    <tr
                      key={attempt.id}
                      onClick={() => onInspectAttempt(attempt.id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    >
                      <td className="max-w-[220px] truncate px-5 py-3 font-medium text-slate-900">
                        {attempt.topic}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{attempt.difficulty}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums">
                        {formatDate(attempt.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs font-semibold tabular-nums">
                        <span
                          className={
                            attempt.percentage >= 70
                              ? 'text-emerald-700'
                              : attempt.percentage >= 50
                                ? 'text-amber-700'
                                : 'text-rose-700'
                          }
                        >
                          {attempt.correctCount}/{attempt.totalQuestions} ({attempt.percentage}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Saved Notes
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('materials')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              Manage
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-800">No study materials yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Paste notes or upload a .txt document to begin.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notes.slice(0, 5).map((note) => {
                const words = note.content.trim().split(/\s+/).filter(Boolean).length;
                return (
                  <li key={note.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{note.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                        {words} words · {formatDate(note.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartQuizForNote(note.id)}
                      className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                    >
                      Quiz
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
