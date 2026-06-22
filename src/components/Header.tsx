import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode
}) => {
  return (
    <header className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 sticky top-0 z-10 py-3 transition-colors print:hidden shadow-sm">
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

        <div className="flex items-center gap-2">
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
