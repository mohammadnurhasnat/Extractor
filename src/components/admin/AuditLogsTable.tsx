import React from 'react';

interface AuditLogsTableProps {
  logs: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AuditLogsTable({ logs, isLoading, onRefresh }: AuditLogsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return <div className="text-center py-10 text-slate-400 text-xs">No audit logs found.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Audit Logs</p>
        <button onClick={onRefresh} className="text-xs font-bold text-blue-500 hover:underline">Refresh</button>
      </div>
      <div className="overflow-x-auto border border-slate-100 dark:border-zinc-900 rounded-[5px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-2.5 w-10">#</th>
              <th className="p-2.5 w-32">Time</th>
              <th className="p-2.5 w-32">Action</th>
              <th className="p-2.5 w-32">User ID</th>
              <th className="p-2.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 text-xs">
            {logs.map((log: any, idx: number) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30 group">
                <td className="p-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[10px] font-black flex items-center justify-center text-slate-500 dark:text-zinc-400 shrink-0 group-hover:bg-blue-500/10 group-hover:text-blue-600 group-hover:border-blue-500/20 transition-all shadow-sm">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </td>
                <td className="p-2.5 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-2.5">
                  <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                    log.action === 'LOGIN' ? 'bg-blue-500/10 text-blue-600' :
                    log.action === 'EXTRACTION' ? 'bg-emerald-500/10 text-emerald-600' :
                    'bg-amber-500/10 text-amber-600'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">{log.userId}</td>
                <td className="p-2.5">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
