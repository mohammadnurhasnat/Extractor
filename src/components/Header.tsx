import React from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon, LogOut, User, RefreshCw, Users, ShieldCheck, Cloud, CloudOff, Settings } from 'lucide-react';
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

  const handleThemeToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const docAny = document as any;
    if (!docAny.startViewTransition) {
      onToggleDarkMode();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const right = window.innerWidth - x;
    const bottom = window.innerHeight - y;
    const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom));

    // Determine direction before the transition snapshot is captured
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    if (isCurrentlyDark) {
      document.documentElement.classList.add('theme-transition-dark-to-light');
    } else {
      document.documentElement.classList.add('theme-transition-light-to-dark');
    }

    const transition = docAny.startViewTransition(() => {
      // Synchronously update the React state and commit DOM changes
      flushSync(() => {
        onToggleDarkMode();
      });
      
      // Toggle class synchronously on documentElement inside the callback to ensure snapshot accuracy
      if (isCurrentlyDark) {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    });

    transition.ready.then(() => {
      if (isCurrentlyDark) {
        // Dark to Light: Old view (Dark) is on top. We collapse/shrink it back into the button (Accelerated for 144Hz)
        document.documentElement.animate(
          [
            { clipPath: `circle(${maxRadius}px at ${x}px ${y}px)` },
            { clipPath: `circle(0px at ${x}px ${y}px)` }
          ],
          {
            duration: 480,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-old(root)',
            fill: 'forwards'
          }
        );
      } else {
        // Light to Dark: New view (Dark) is on top. We expand it outwards from the button (Accelerated for 144Hz)
        document.documentElement.animate(
          [
            { clipPath: `circle(0px at ${x}px ${y}px)` },
            { clipPath: `circle(${maxRadius}px at ${x}px ${y}px)` }
          ],
          {
            duration: 480,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
            fill: 'forwards'
          }
        );
      }
    });

    // Cleanup transition classes when transition completes or fails
    transition.finished.finally(() => {
      document.documentElement.classList.remove('theme-transition-dark-to-light', 'theme-transition-light-to-dark');
    });
  };

  return (
    <header className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 sticky top-0 z-40 py-2.5 transition-colors print:hidden shadow-sm">
      <div className="w-full px-3.5 flex items-center justify-between gap-2">
        {/* Left column: Theme Toggle Icon */}
        <div className="flex items-center justify-start shrink-0">
          <button
            onClick={handleThemeToggle}
            className="slide-btn slide-btn-slate p-1.5 sm:p-2 rounded-[8px] flex items-center justify-center shrink-0 group active:scale-95 transition-transform"
            aria-label="Toggle dark mode"
          >
            <div
              style={{ viewTransitionName: 'theme-icon' } as React.CSSProperties}
              className="relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:rotate-12"
            >
              {isDarkMode ? (
                <Moon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-amber-400 fill-amber-400/20" />
              ) : (
                <Sun className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-amber-500 fill-amber-500/20" />
              )}
            </div>
          </button>
        </div>

        {/* Center column: Website Name - flex-1 min-w-0 for perfect space allocation without overlap */}
        <div className="flex-1 min-w-0 text-center px-0.5 sm:px-2 flex justify-center">
          <div className="inline-flex items-center justify-center bg-slate-50 dark:bg-zinc-900/80 px-3 sm:px-4 py-0.5 sm:py-1 rounded-[10px] border-2 border-zinc-950 dark:border-white/40 shadow-[0_3px_0_0_rgba(0,0,0,0.2)] dark:shadow-[0_3px_0_0_rgba(255,255,255,0.15)] transform -translate-y-[1px] select-none cursor-default">
            <h1 className="text-[12px] xs:text-[14px] sm:text-lg md:text-xl lg:text-2xl font-black tracking-[0.2em] text-zinc-900 dark:text-zinc-100 uppercase truncate">
              Extractor
            </h1>
          </div>
        </div>
        {/* Right column: User Button (bam pase) and Profile Button (dan pase) */}
        <div className="flex items-center gap-1 sm:gap-3 lg:gap-4 shrink-0 min-w-0">
          {isAdmin && (
            <button
              onClick={onOpenAdminUsers}
              className="slide-btn slide-btn-slate px-3 py-1 rounded-full font-bold text-[9px] sm:text-xs flex items-center justify-center gap-1 shrink-0 ripple-btn"
              title="Manage Registered Users"
            >
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Users</span>
              </span>
            </button>
          )}
          {currentUser && (
            <div className="flex items-center gap-2 sm:gap-4 px-1 py-1 sm:px-2 sm:py-1.5 bg-slate-100/60 dark:bg-zinc-900/60 rounded-[8px] border border-slate-200/50 dark:border-zinc-800/50 min-w-0 shrink-0">
              {/* Daily Limit - strictly hidden for Admin */}
              {!isAdmin && limitStatus && (
                <span className={`text-[8px] sm:text-[10px] font-extrabold px-1 py-0.5 rounded-[3px] flex items-center gap-0.5 shrink-0 ${
                  limitStatus.remaining > 0 
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" 
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-400 animate-pulse"
                }`}>
                  <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 animate-spin-slow" />
                  <span>{limitStatus.remaining}/{limitStatus.limit}</span>
                </span>
              )}

              {/* Profile Button - Only icon on ultra-small screens */}
              <button
                onClick={onOpenProfile}
                className="slide-btn slide-btn-purple px-1.5 sm:px-2.5 py-1 rounded-[4px] font-bold text-[9px] sm:text-[11px] flex items-center gap-1 sm:gap-1.5 hover:shadow-sm shrink-0 min-w-0 ripple-btn"
                title="Profile Settings"
              >
                <span className="relative z-10 flex items-center gap-1">
                  <span className="truncate max-w-[50px] xs:max-w-[80px] sm:max-w-[120px] hidden xs:inline-block">
                    {currentUser.name || currentUser.mobileNumber}
                  </span>
                  <Settings className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0 xs:hidden sm:block" />
                </span>
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="slide-btn slide-btn-orange p-1.5 sm:px-3 sm:py-1.5 rounded-[4px] font-bold text-[9px] sm:text-[11px] flex items-center justify-center gap-1 shrink-0 ripple-btn"
                title="Sign out"
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <span className="hidden sm:inline">Logout</span>
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
