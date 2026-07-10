import React from 'react';
import { Loader2, Save } from 'lucide-react';

interface AddUserFormProps {
  newUserName: string;
  setNewUserName: (val: string) => void;
  newUserMobileNumber: string;
  setNewUserMobileNumber: (val: string) => void;
  newUserEmail: string;
  setNewUserEmail: (val: string) => void;
  newUserPassword: string;
  setNewUserPassword: (val: string) => void;
  isSavingUser: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddUserForm({
  newUserName,
  setNewUserName,
  newUserMobileNumber,
  setNewUserMobileNumber,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  isSavingUser,
  onCancel,
  onSubmit
}: AddUserFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h4 className="text-xs font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-900/50 pb-1 mb-2">
        Create New Portal User
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
          <input 
            type="text" 
            required 
            value={newUserName} 
            onChange={e => setNewUserName(e.target.value)} 
            className="w-full px-3 py-2 border rounded-[5px] text-xs bg-white dark:bg-black/40 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 font-medium" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mobile Number</label>
          <input 
            type="text" 
            required 
            value={newUserMobileNumber} 
            onChange={e => setNewUserMobileNumber(e.target.value)} 
            className="w-full px-3 py-2 border rounded-[5px] text-xs bg-white dark:bg-black/40 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 font-medium" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
          <input 
            type="email" 
            value={newUserEmail} 
            onChange={e => setNewUserEmail(e.target.value)} 
            className="w-full px-3 py-2 border rounded-[5px] text-xs bg-white dark:bg-black/40 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 font-medium" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Passcode</label>
          <input 
            type="password" 
            required 
            value={newUserPassword} 
            onChange={e => setNewUserPassword(e.target.value)} 
            className="w-full px-3 py-2 border rounded-[5px] text-xs bg-white dark:bg-black/40 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-blue-500 font-medium" 
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end border-t border-slate-100 dark:border-zinc-900/50 pt-3 mt-4">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-[5px]"
        >Cancel</button>
        <button 
          type="submit" 
          disabled={isSavingUser} 
          className="slide-btn slide-btn-blue px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            {isSavingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save User</span>
          </span>
        </button>
      </div>
    </form>
  );
}
