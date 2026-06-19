import React from 'react';
import { FileText, Settings, Sun, Moon, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userApiKey: string;
  onOpenApiSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode,
  userApiKey,
  onOpenApiSettings,
}) => {
  const { user, signInWithGoogle, logout } = useAuth();
  
  return (
    <header className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 sticky top-0 z-10 py-3 transition-colors print:hidden shadow-sm">
      <div className="max-w-5xl mx-auto px-6 w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-inner border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
          </div>
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
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-medium text-slate-600 dark:text-zinc-300">
                {user.displayName?.split(' ')[0]}
              </span>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full border border-slate-200 dark:border-zinc-700" referrerPolicy="no-referrer" />
              ) : null}
              <button 
                onClick={logout}
                className="p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 cursor-pointer transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 cursor-pointer font-medium text-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 ml-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure & In-Memory Processing
          </div>
          <button
            onClick={onOpenApiSettings}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors relative cursor-pointer"
            aria-label="API Settings"
            title="Configure Gemini API Key"
          >
            <Settings className="w-4 h-4" />
            {!userApiKey && (
              <>
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
              </>
            )}
          </button>
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
