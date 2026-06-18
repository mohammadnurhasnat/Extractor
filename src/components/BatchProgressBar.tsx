import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { QueueItem } from '../types';

interface BatchProgressBarProps {
  isBatchProcessing: boolean;
  queue: QueueItem[];
}

export function BatchProgressBar({ isBatchProcessing, queue }: BatchProgressBarProps) {
  const totalItemsAvailable = queue.length;
  const completedCount = queue.filter(q => q.status === 'completed').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;
  const processedCount = completedCount + failedCount;
  const progressPercentage = totalItemsAvailable > 0 ? Math.round((processedCount / totalItemsAvailable) * 100) : 0;

  return (
    <div className="bg-slate-50/80 dark:bg-black/40 border border-slate-200/50 dark:border-zinc-800/60 rounded-xl p-3 mb-4 transition-colors">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-slate-600 dark:text-zinc-400">
          {isBatchProcessing ? (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold font-sans">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Batch extracting...
            </span>
          ) : progressPercentage === 100 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 font-sans">
              <Check className="w-3.5 h-3.5" /> All processed!
            </span>
          ) : (
            <span className="text-slate-500 dark:text-zinc-500 font-medium">Batch Progress</span>
          )}
        </span>
        <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-300">
          {progressPercentage}% ({processedCount}/{totalItemsAvailable})
        </span>
      </div>
      
      <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
        <motion.div 
          className={`h-full rounded-full ${
            failedCount > 0 
              ? 'bg-amber-500' 
              : 'bg-gradient-to-r from-blue-500 to-emerald-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider font-sans">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Queued: {queue.filter(q => q.status === 'queued').length}
        </span>
        {queue.some(q => q.status === 'extracting') && (
          <span className="flex items-center gap-1 text-blue-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Extracting: {queue.filter(q => q.status === 'extracting').length}
          </span>
        )}
        {completedCount > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Success: {completedCount}
          </span>
        )}
        {failedCount > 0 && (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Failed: {failedCount}
          </span>
        )}
      </div>
    </div>
  );
}
