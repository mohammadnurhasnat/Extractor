import React from 'react';
import { Sun, Moon, LogOut, User, RefreshCw, Users, ShieldCheck, Cloud, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: { id: string; email: string; name: string; mobileNumber: string } | null;
  onLogout?: () => void;
  limitStatus?: { count: number; remaining: number; limit: number } | null;
  onOpenAdminUsers?: () => void;
  profilePicture?: string | null;
  onOpenProfile?: () => void;
  isSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onLogout,
  limitStatus,
  onOpenAdminUsers,
  profilePicture,
  onOpenProfile,
  isSynced = true
}) => {

  const isAdmin = currentUser?.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
  const initials = currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EX';

  return (
    <header className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 sticky top-0 z-40 py-2.5 transition-colors print:hidden shadow-sm">
      <div className="w-full px-3.5 flex items-center justify-between gap-2">
        {/* Left column: Theme Toggle Icon */}
        <div className="flex items-center justify-start shrink-0">
          <button
            onClick={onToggleDarkMode}
            className="relative w-6 h-6 sm:w-7.5 sm:h-7.5 flex items-center justify-center rounded-[5px] bg-slate-100/80 hover:bg-amber-500/10 dark:bg-zinc-900/80 dark:hover:bg-indigo-500/15 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-800/80 hover:border-amber-400 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer active:scale-95 shrink-0"
            aria-label="Toggle dark mode"
          >
            {/* Ambient Background Glow on Hover */}
            <span className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 to-amber-500/5 dark:from-indigo-500/0 dark:to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <AnimatePresence mode="wait" initial={false}>
              {isDarkMode ? (
                <motion.div
                  key="moon"
                  initial={{ y: 8, opacity: 0, rotate: -45 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -8, opacity: 0, rotate: 45 }}
                  transition={{ type: "spring", stiffness: 220, damping: 15 }}
                  className="relative z-10 flex items-center justify-center animate-none"
                >
                  <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 fill-indigo-400/20 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ y: 8, opacity: 0, rotate: 45 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -8, opacity: 0, rotate: -45 }}
                  transition={{ type: "spring", stiffness: 220, damping: 15 }}
                  className="relative z-10 flex items-center justify-center animate-none"
                >
                  <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Center column: Website Name - flex-1 min-w-0 for perfect space allocation without overlap */}
        <div className="flex-1 min-w-0 text-center px-0.5 sm:px-2">
          <h1 className="text-[12px] xs:text-[14px] sm:text-lg md:text-xl lg:text-2xl font-black tracking-widest text-slate-800 dark:text-zinc-100 uppercase select-none truncate">
            Extractor
          </h1>
        </div>

        {/* Right column: User Button (bam pase) and Profile Button (dan pase) */}
        <div className="flex items-center gap-1 sm:gap-2 justify-end shrink-0 min-w-0">
          {currentUser && isAdmin && (
            <button
              onClick={onOpenAdminUsers}
              className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1.5 text-[9px] sm:text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-[5px] border border-blue-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
              title="Manage Registered Users"
            >
              <Users className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              <span>Users</span>
            </button>
          )}

          {currentUser && (
            <div className="flex items-center gap-0.5 sm:gap-1.5 px-0.5 py-0.5 sm:px-1.5 sm:py-1 bg-slate-100/60 dark:bg-zinc-900/60 rounded-[5px] border border-slate-200/50 dark:border-zinc-800/50 min-w-0 shrink-0">
              {/* Daily Limit - strictly hidden for Admin */}
              {!isAdmin && limitStatus && (
                <span className={`text-[8px] sm:text-[10px] font-extrabold px-1 py-0.5 rounded-[3px] flex items-center gap-0.5 shrink-0 ${
                  limitStatus.remaining > 0 
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 animate-pulse'
                }`}>
                  <RefreshCw className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0 animate-spin-slow" />
                  <span>{limitStatus.remaining}/{limitStatus.limit}</span>
                </span>
              )}
              
              {/* Interactive Profile Area - full name with smaller font if wrapped */}
              <button
                onClick={onOpenProfile}
                className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-500 rounded-[5px] text-slate-800 dark:text-zinc-200 hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer shadow-xs flex items-center justify-center min-h-[18px] sm:min-h-[26px]"
                title="View Profile Details"
              >
                <span className="text-[8px] xs:text-[9px] sm:text-xs font-bold leading-[1.15] sm:leading-tight break-words max-w-[55px] xs:max-w-[80px] sm:max-w-[150px] line-clamp-2 overflow-hidden text-ellipsis text-left block max-h-[20px] xs:max-h-[22px] sm:max-h-[32px]">
                  {currentUser.name}
                </span>
              </button>
              
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="w-4.5 h-4.5 sm:w-6 sm:h-6 flex items-center justify-center rounded-[5px] bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shrink-0 ml-0.5 shadow-sm"
                title="Log Out"
                aria-label="Log out"
              >
                <LogOut className="w-2 h-2 sm:w-3 sm:h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

