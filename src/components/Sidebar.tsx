import {
  BookOpen,
  History,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  X,
} from 'lucide-react';
import type { ActiveView } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  notesCount: number;
  historyCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: typeof LayoutDashboard;
  count?: number;
}

export function Sidebar({
  activeView,
  onSelectView,
  notesCount,
  historyCount,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Study Materials', icon: BookOpen, count: notesCount },
    { id: 'quiz', label: 'AI Quiz Generator', icon: Sparkles },
    { id: 'history', label: 'Quiz History', icon: History, count: historyCount },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquareText },
  ];

  const handleSelect = (id: ActiveView) => {
    onSelectView(id);
    onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Primary Sidebar Navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <button
            type="button"
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white font-display">
              SL
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              StudyLoop
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-violet-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-blue-700 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4">
          <p className="text-xs font-medium text-slate-700">Local Study Workspace</p>
          <p className="mt-1 text-xs text-slate-500">
            Notes and quiz history are saved automatically in your browser.
          </p>
        </div>
      </aside>
    </>
  );
}
