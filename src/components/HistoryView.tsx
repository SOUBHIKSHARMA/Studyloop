import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Search,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { ActiveView, QuizAttempt, QuizDifficulty } from '../types';

interface HistoryViewProps {
  history: QuizAttempt[];
  inspectedAttemptId: string | null;
  onDeleteAttempt: (id: string) => void;
  onClearHistory: () => void;
  onNavigate: (view: ActiveView) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function HistoryView({
  history,
  inspectedAttemptId,
  onDeleteAttempt,
  onClearHistory,
  onNavigate,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | QuizDifficulty>('All');
  const [expandedId, setExpandedId] = useState<string | null>(inspectedAttemptId);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (inspectedAttemptId) {
      setExpandedId(inspectedAttemptId);
    }
  }, [inspectedAttemptId]);

  const filteredHistory = history.filter((item) => {
    const matchesDifficulty =
      difficultyFilter === 'All' || item.difficulty === difficultyFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || item.topic.toLowerCase().includes(q);
    return matchesDifficulty && matchesSearch;
  });

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
        <History className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-4 font-display text-lg font-semibold text-slate-900">
          No quiz attempts recorded yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Completed quizzes are automatically saved here with your score, date, difficulty, and full answer explanations.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('quiz')}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
        >
          <Sparkles className="h-4 w-4" />
          <span>Take a Quiz</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by topic..."
              aria-label="Filter quiz history by topic"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficultyFilter(level)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  difficultyFilter === level
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {confirmClear ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setConfirmClear(false);
                }}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700 whitespace-nowrap"
              >
                Confirm Clear All
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-rose-600 whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            No quiz attempts match your current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((attempt) => {
            const isExpanded = expandedId === attempt.id;
            const scoreColor =
              attempt.percentage >= 70
                ? 'text-emerald-700'
                : attempt.percentage >= 50
                  ? 'text-amber-700'
                  : 'text-rose-700';

            return (
              <article
                key={attempt.id}
                className="rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-semibold text-slate-900">
                      {attempt.topic}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 tabular-nums">
                      {attempt.difficulty} · {attempt.totalQuestions} questions ·{' '}
                      {formatDateTime(attempt.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className={`font-mono text-base font-semibold tabular-nums ${scoreColor}`}>
                        {attempt.percentage}%
                      </p>
                      <p className="font-mono text-xs text-slate-500 tabular-nums">
                        {attempt.correctCount}/{attempt.totalQuestions} correct
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : attempt.id)
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        <span>{isExpanded ? 'Hide Review' : 'Review'}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteAttempt(attempt.id)}
                        aria-label={`Delete quiz attempt for ${attempt.topic}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-4 border-t border-slate-200 bg-slate-50/50 p-5">
                    {attempt.questions.map((q, idx) => {
                      const userChoice = attempt.selectedAnswers[q.id];
                      const isCorrect = userChoice === q.correctIndex;
                      return (
                        <div
                          key={q.id}
                          className="rounded-lg border border-slate-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">
                              <span className="mr-1.5 font-mono text-slate-400 tabular-nums">
                                {idx + 1}.
                              </span>
                              {q.question}
                            </p>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${
                                isCorrect ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {isCorrect ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Correct</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>
                                    {userChoice === undefined ? 'Unanswered' : 'Incorrect'}
                                  </span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            {q.options.map((opt, optIdx) => {
                              const isRight = optIdx === q.correctIndex;
                              const isPicked = optIdx === userChoice;
                              return (
                                <div
                                  key={optIdx}
                                  className={`rounded-md border px-3 py-2 text-xs ${
                                    isRight
                                      ? 'border-emerald-300 bg-emerald-50 font-medium text-emerald-950'
                                      : isPicked
                                        ? 'border-rose-300 bg-rose-50 text-rose-950'
                                        : 'border-slate-200 bg-white text-slate-600'
                                  }`}
                                >
                                  <span className="mr-1.5 font-mono font-semibold">
                                    {OPTION_LETTERS[optIdx]}.
                                  </span>
                                  {opt}
                                </div>
                              );
                            })}
                          </div>

                          <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                            <span className="font-semibold text-slate-800">Explanation: </span>
                            {q.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
