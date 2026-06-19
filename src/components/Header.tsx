import React, { useState } from 'react';
import { Settings, Sun, Moon, LogIn, LogOut, User } from 'lucide-react';
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
  const [showProfile, setShowProfile] = useState(false);
  
  return (
    <header className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 sticky top-0 z-10 py-3 transition-colors print:hidden shadow-sm">
      <div className="max-w-5xl mx-auto px-6 w-full flex justify-between items-center">
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
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 cursor-pointer outline-none"
              >
                <span className="hidden sm:inline-block text-xs font-medium text-slate-600 dark:text-zinc-300">
                  {user.displayName?.split(' ')[0]}
                </span>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-[30px] h-[30px] rounded-[5px] border border-slate-200 dark:border-zinc-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-[30px] h-[30px] rounded-[5px] bg-slate-200 dark:bg-zinc-800 flex items-center justify-center border border-slate-300 dark:border-zinc-700">
                    <User className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                  </div>
                )}
              </button>

              {showProfile && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 overflow-hidden text-sm">
                    <div className="p-3 border-b border-slate-100 dark:border-zinc-800">
                      <div className="font-medium text-slate-800 dark:text-zinc-200">{user.displayName}</div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user.email}</div>
                    </div>
                    <div className="p-1.5">
                      <button 
                        onClick={() => { setShowProfile(false); logout(); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 text-left transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
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

          <button
            onClick={onOpenApiSettings}
            className="p-1.5 ml-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors relative cursor-pointer"
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
