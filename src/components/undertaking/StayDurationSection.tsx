import React from 'react';
import { UndertakingFormData } from '../../types';

interface StayDurationSectionProps {
  undertakingData: UndertakingFormData;
  isUndertakingEditable: boolean;
  handleUpdateUndertakingField: (field: keyof UndertakingFormData, value: string) => void;
}

export function StayDurationSection({
  undertakingData,
  isUndertakingEditable,
  handleUpdateUndertakingField
}: StayDurationSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-slate-800 dark:text-zinc-100 tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
        <span className="text-blue-500 font-mono">3.</span> Duration of Stay
      </h3>
      
      <div className="pl-4 sm:pl-6 text-sm font-sans text-slate-700 dark:text-zinc-350 leading-relaxed">
        {undertakingData.purpose.toLowerCase().includes('medical') ? (
          <div className="italic text-slate-800 dark:text-zinc-200 font-medium bg-blue-50/50 dark:bg-zinc-900/30 p-2.5 rounded border border-slate-100 dark:border-zinc-800 max-w-2xl">
            "The exact duration and dates of my stay in India will depend entirely upon the medical treatment requirements, progress, and schedule as prescribed and advised by the consulting hospital and medical specialists."
          </div>
        ) : undertakingData.purpose === 'Double Entry' ? (
          <div className="italic text-slate-800 dark:text-zinc-250 font-semibold bg-amber-500/5 dark:bg-zinc-900/30 p-3 rounded-lg border border-amber-200 dark:border-zinc-800 max-w-2xl leading-relaxed">
            "My scheduled embassy appointment is on <span className="font-bold text-amber-700 dark:text-amber-400 underline decoration-dashed decoration-amber-400">{undertakingData.embassyDate || '_________________'}</span>. 
            I intend to stay in India solely for the period necessary to complete my consular interview and visa formalities."
          </div>
        ) : undertakingData.purpose.toLowerCase().includes('tourism') ? (
          <div className="italic text-slate-800 dark:text-zinc-250 font-semibold bg-emerald-500/5 dark:bg-zinc-900/30 p-3 rounded-lg border border-emerald-200 dark:border-zinc-800 max-w-2xl leading-relaxed">
            "The exact duration and dates of my stay in India will be determined after the successful grant of my tourist visa. I will decide on the travel dates and duration of stay once the visa is approved, as my travel plans depend entirely on the visa issuance."
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>I intend to stay in India for a duration of</span>
            {isUndertakingEditable ? (
              <input 
                type="text" 
                value={undertakingData.duration || ''}
                onChange={(e) => handleUpdateUndertakingField('duration', e.target.value)}
                className="min-w-[80px] text-center bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="[Duration]"
              />
            ) : (
              <span className="font-bold underline decoration-dashed decoration-slate-400 px-2 text-slate-900 dark:text-zinc-100">{undertakingData.duration || '_______'}</span>
            )}
            <span>starting from</span>
            {isUndertakingEditable ? (
              <input 
                type="text" 
                value={undertakingData.travelFrom || ''}
                onChange={(e) => handleUpdateUndertakingField('travelFrom', e.target.value)}
                className="min-w-[100px] text-center bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="[From Date]"
              />
            ) : (
              <span className="underline decoration-dashed decoration-slate-400 px-2 text-slate-900 dark:text-zinc-100">{undertakingData.travelFrom || '__________'}</span>
            )}
            <span>to</span>
            {isUndertakingEditable ? (
              <input 
                type="text" 
                value={undertakingData.travelTo || ''}
                onChange={(e) => handleUpdateUndertakingField('travelTo', e.target.value)}
                className="min-w-[100px] text-center bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="[To Date]"
              />
            ) : (
              <span className="underline decoration-dashed decoration-slate-400 px-2 text-slate-900 dark:text-zinc-100">{undertakingData.travelTo || '__________'}</span>
            )}
            <span>.</span>
          </div>
        )}
      </div>
    </div>
  );
}
