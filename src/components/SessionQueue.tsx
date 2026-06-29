import React from 'react';
import { Play, Download, Loader2, Clock, Check, AlertCircle, X, FileText } from 'lucide-react';
import { QueueItem } from '../types';
import { BatchProgressBar } from './BatchProgressBar';

interface SessionQueueProps {
  queue: QueueItem[];
  activeQueueId: string | null;
  isBatchProcessing: boolean;
  isOnline: boolean;
  isZipping: boolean;
  processEntireQueue: () => void;
  handleDownloadAllZIP: () => void;
  selectQueueItem: (item: QueueItem) => void;
  removeFromQueue: (e: React.MouseEvent, itemId: string) => void;
  extractSingleItem: (itemId: string) => void;
  cancelExtraction: () => void;
}

export function SessionQueue({
  queue,
  activeQueueId,
  isBatchProcessing,
  isOnline,
  isZipping,
  processEntireQueue,
  handleDownloadAllZIP,
  selectQueueItem,
  removeFromQueue,
  extractSingleItem,
  cancelExtraction,
}: SessionQueueProps) {
  if (queue.length === 0) return null;

  return (
    <div className="shrink-0 mt-6 border-t border-slate-200/50 dark:border-zinc-800/50 pt-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">
            Session Queue ({queue.length})
          </h3>
          {queue.some(q => q.status === 'extracting') && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {queue.some(q => q.status === 'queued' || q.status === 'failed' || q.status === 'extracting') && (
            <button
              onClick={isBatchProcessing ? cancelExtraction : processEntireQueue}
              disabled={!isBatchProcessing && !isOnline}
              className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 shrink-0 cursor-pointer ${
                isBatchProcessing 
                  ? 'text-red-600 dark:text-red-400 hover:text-red-700 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
              }`}
            >
              {isBatchProcessing ? (
                <>
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
                  Stop Extraction
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Extract All
                </>
              )}
            </button>
          )}

          {queue.some(q => q.status === 'completed' && q.data) && (
            <button
              onClick={handleDownloadAllZIP}
              disabled={isZipping}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/10 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Zipping...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download All
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Batch Process Progress Bar */}
      <BatchProgressBar isBatchProcessing={isBatchProcessing} queue={queue} />

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
        {queue.map((item, index) => {
          const isActive = item.id === activeQueueId;
          const isPending = item.status === 'queued';
          const isExtracting = item.status === 'extracting';
          const isCompleted = item.status === 'completed';
          const isFailed = item.status === 'failed';
          
          return (
            <div
              key={item.id}
              onClick={() => !isBatchProcessing && selectQueueItem(item)}
              className={`group/item flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isBatchProcessing ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
              } ${
                isActive
                  ? 'bg-blue-50/50 dark:bg-zinc-800/40 border-blue-300 dark:border-zinc-700 ring-1 ring-blue-200 dark:ring-zinc-800/30'
                  : 'bg-white dark:bg-black border-slate-200/60 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-[11px] font-bold font-mono text-slate-400 min-w-[16px] text-center shrink-0">
                  #{index + 1}
                </span>
                
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-center overflow-hidden shrink-0">
                  {item.preview ? (
                    <img src={item.preview} className="w-full h-full object-cover" alt="Thumb" />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate pr-2">
                    {item.file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>{item.file.size > 0 ? `${(item.file.size / (1024 * 1024)).toFixed(2)} MB` : 'History scan'}</span>
                    {item.compressionRatio && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-900/10" title="Client-Side Image Compression Active">
                        Compressed {item.compressionRatio}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {isPending && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-slate-200/50 dark:border-zinc-800/50">
                    <Clock className="w-3 h-3" /> Queued
                  </span>
                )}
                {isExtracting && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/20">
                    <Loader2 className="w-3 h-3 animate-spin" /> Processing
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/15 px-2 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-900/30">
                    <Check className="w-3 h-3 text-emerald-500" /> Extracted
                  </span>
                )}
                {isFailed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30" title={item.error || 'Extraction Failed'}>
                    <AlertCircle className="w-3 h-3 text-red-500" /> Fail
                  </span>
                )}

                {(isPending || isFailed) && !isBatchProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      extractSingleItem(item.id);
                    }}
                    disabled={!isOnline}
                    className="p-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition cursor-pointer"
                    title="Extract Data"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={(e) => removeFromQueue(e, item.id)}
                  disabled={isExtracting || isBatchProcessing}
                  className="p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-rose-50 dark:hover:bg-zinc-800 transition disabled:opacity-30 cursor-pointer"
                  title="Remove from queue"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
