import React from 'react';

interface UsersTableProps {
  users: any[];
  isLoading: boolean;
  error: string | null;
  onUpdateLimit: (userId: string, newLimit: number) => void;
  onToggleSuspend: (userId: string, currentStatus: boolean) => void;
  onDelete: (userId: string) => void;
  onSelectUser: (user: any) => void;
}

export function UsersTable({
  users,
  isLoading,
  error,
  onUpdateLimit,
  onToggleSuspend,
  onDelete,
  onSelectUser
}: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-rose-500 text-center text-xs py-10">{error}</div>;
  }

  return (
    <div className="overflow-x-auto border border-slate-100 dark:border-zinc-900 rounded-[5px]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="p-2.5 w-10">#</th>
            <th className="p-2.5">Profile Name</th>
            <th className="p-2.5">Mobile Number</th>
            <th className="p-2.5">Email</th>
            <th className="p-2.5">Passcode</th>
            <th className="p-2.5">Daily Limit</th>
            <th className="p-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
          {users.map((user, idx) => {
            const isUserAdmin = user.email && user.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
            return (
              <tr 
                key={user.id} 
                onClick={() => onSelectUser(user)} 
                className="text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-900/30 cursor-pointer group transition-all"
              >
                <td className="p-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-black flex items-center justify-center text-slate-500 dark:text-zinc-400 shrink-0 group-hover:bg-blue-500/10 group-hover:text-blue-600 group-hover:border-blue-500/20 transition-all shadow-sm">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </td>
                <td className="p-2.5 flex items-center gap-1.5 min-h-[40px]">
                  <span>{user.name}</span>
                  {user.isSuspended && (
                    <span className="text-[8px] font-black bg-rose-500/10 text-rose-600 px-1 py-0.5 rounded">
                      Suspended
                    </span>
                  )}
                </td>
                <td className="p-2.5 font-mono">{user.mobileNumber}</td>
                <td className="p-2.5">{user.email || 'none'}</td>
                <td className="p-2.5 font-mono font-bold text-blue-500">{user.password}</td>
                <td className="p-2.5" onClick={e => e.stopPropagation()}>
                  {isUserAdmin ? (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      No Limit
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => onUpdateLimit(user.id, Math.max(0, (user.dailyLimit ?? 5) - 1))} 
                        className="w-5 h-5 border border-slate-200 dark:border-zinc-800 rounded flex justify-center items-center font-bold hover:bg-slate-50 dark:hover:bg-zinc-800"
                      >-</button>
                      <span className="w-5 text-center font-mono font-bold">{user.dailyLimit ?? 5}</span>
                      <button 
                        onClick={() => onUpdateLimit(user.id, (user.dailyLimit ?? 5) + 1)} 
                        className="w-5 h-5 border border-slate-200 dark:border-zinc-800 rounded flex justify-center items-center font-bold hover:bg-slate-50 dark:hover:bg-zinc-800"
                      >+</button>
                    </div>
                  )}
                </td>
                <td className="p-2.5 text-right" onClick={e => e.stopPropagation()}>
                  {!isUserAdmin && (
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => onToggleSuspend(user.id, !!user.isSuspended)} 
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${user.isSuspended ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
                      >
                        {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                      <button 
                        onClick={() => onDelete(user.id)} 
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/10 text-rose-600 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
