import React from 'react';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; email: string; name: string; mobileNumber: string } | null;
  profilePicture?: string | null;
  onSaveProfilePicture?: (dataUrl: string) => void;
}

export const ProfileCustomizationModal: React.FC<ProfileCustomizationModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  useLockBodyScroll(isOpen);

  if (!isOpen || !currentUser) return null;

  const isAdmin = currentUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md">
      <div className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-sm rounded-[5px] text-black dark:text-white">
        {/* Top Accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${isAdmin ? 'bg-amber-500' : 'bg-blue-600'}`} />

        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-zinc-900/80 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 relative z-10">
          <h3 className="font-extrabold text-xs tracking-tight text-black dark:text-white uppercase">
            USER PROFILE (ব্যবহারকারী প্রোফাইল)
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-3.5">
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                Name (নাম)
              </label>
              <div className="px-3 py-2 border border-slate-100 dark:border-zinc-900/60 bg-slate-50/50 dark:bg-zinc-950/50 rounded-[4px] text-xs font-bold text-slate-800 dark:text-zinc-200">
                {currentUser.name}
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                Email Address (ইমেইল)
              </label>
              <div className="px-3 py-2 border border-slate-100 dark:border-zinc-900/60 bg-slate-50/50 dark:bg-zinc-950/50 rounded-[4px] text-xs font-mono font-bold text-slate-800 dark:text-zinc-200">
                {currentUser.email || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                Phone Number (মোবাইল নাম্বার)
              </label>
              <div className="px-3 py-2 border border-slate-100 dark:border-zinc-900/60 bg-slate-50/50 dark:bg-zinc-950/50 rounded-[4px] text-xs font-mono font-bold text-slate-800 dark:text-zinc-200">
                {currentUser.mobileNumber || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                Account Status (স্ট্যাটাস)
              </label>
              <div className="px-3 py-1.5 flex items-center gap-1.5 border border-slate-100 dark:border-zinc-900/60 bg-slate-50/50 dark:bg-zinc-950/50 rounded-[4px] text-xs font-bold">
                <span className={`inline-block w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                <span className={isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {isAdmin ? 'System Administrator' : 'Verified Core User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-zinc-900/80 bg-white/60 dark:bg-zinc-950/60 relative z-10 flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
          <span>{isAdmin ? 'Admin Panel' : 'User Session'}</span>
          <span>Secured</span>
        </div>
      </div>
    </div>
  );
};
