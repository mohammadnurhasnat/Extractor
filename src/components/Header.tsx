import React from 'react';
import { Sun, Moon, LogOut, User, RefreshCw } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: { id: string; email: string; name: string; mobileNumber: string } | null;
  onLogout?: () => void;
  limitStatus?: { count: number; remaining: number; limit: number } | null;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onLogout,
  limitStatus
}) => {
  return (
    <header className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 sticky top-0 z-40 py-3 transition-colors print:hidden shadow-sm">
      <div className="w-full px-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 leading-none">
              Extractor
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
              Smart Identity Extraction System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          {currentUser && (
            <div className="flex items-center gap-2 sm:gap-3 px-3 py-1 bg-slate-100/50 dark:bg-zinc-900/50 rounded-full border border-slate-200/30 dark:border-zinc-800/30">
              {/* Daily Limit Badge */}
              {limitStatus && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  limitStatus.remaining > 0 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse'
                }`}>
                  <RefreshCw className="w-3 h-3 shrink-0" />
                  Daily Limit: {limitStatus.remaining}/{limitStatus.limit} left
                </span>
              )}
              
              <div className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-zinc-300">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>{currentUser.name}</span>
              </div>
              
              <button
                onClick={onLogout}
                className="p-1 rounded-full text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors cursor-pointer"
                title="Log Out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

