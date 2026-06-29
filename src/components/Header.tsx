import React from 'react';
import { Sun, Moon, LogOut, User, RefreshCw, Users, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: { id: string; email: string; name: string; mobileNumber: string } | null;
  onLogout?: () => void;
  limitStatus?: { count: number; remaining: number; limit: number } | null;
  onOpenAdminUsers?: () => void;
  profilePicture?: string | null;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onLogout,
  limitStatus,
  onOpenAdminUsers,
  profilePicture,
  onOpenProfile
}) => {

  const isAdmin = currentUser?.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
  const initials = currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EX';

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

        <div className="flex items-center gap-2 sm:gap-4">
          {currentUser && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100/60 dark:bg-zinc-900/60 rounded-[5px] border border-slate-200/50 dark:border-zinc-800/50 max-w-full overflow-hidden">
              
              {/* Daily Limit - strictly hidden for Admin */}
              {!isAdmin && limitStatus && (
                <span className={`text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-[3px] flex items-center gap-1 shrink-0 ${
                  limitStatus.remaining > 0 
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 animate-pulse'
                }`}>
                  <RefreshCw className="w-3 h-3 shrink-0 animate-spin-slow" />
                  <span>Limit: {limitStatus.remaining}/{limitStatus.limit}</span>
                </span>
              )}
              
              {/* Interactive Profile Area */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 hover:opacity-85 active:scale-98 transition-all shrink-0 cursor-pointer"
                title="Edit Profile Settings"
              >
                {/* Profile Picture Thumbnail */}
                <div className="w-5.5 h-5.5 rounded-full overflow-hidden border border-blue-500/35 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                {/* Name */}
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-zinc-200 truncate max-w-[70px] sm:max-w-[120px]">
                    {currentUser.name}
                  </span>
                  {/* Real-time Role Badge Indicators */}
                  <span className={`text-[8px] font-extrabold tracking-wider mt-0.5 uppercase ${
                    isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {isAdmin ? 'ADMIN' : 'VERIFIED'}
                  </span>
                </div>
              </button>
              
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-1 rounded-[3px] text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 dark:text-zinc-400 dark:hover:text-rose-400 transition-all cursor-pointer shrink-0 ml-1"
                title="Log Out"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {currentUser && isAdmin && (
            <button
              onClick={onOpenAdminUsers}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-[5px] border border-blue-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Manage Registered Users"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </button>
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

