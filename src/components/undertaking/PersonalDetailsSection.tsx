import React from 'react';
import { UndertakingFormData } from '../../types';

interface PersonalDetailsSectionProps {
  undertakingData: UndertakingFormData;
  isUndertakingEditable: boolean;
  handleUpdateUndertakingField: (field: keyof UndertakingFormData, value: string) => void;
}

export function PersonalDetailsSection({
  undertakingData,
  isUndertakingEditable,
  handleUpdateUndertakingField
}: PersonalDetailsSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-slate-800 dark:text-zinc-100 tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
        <span className="text-blue-500 font-mono">1.</span> Personal Details
      </h3>
      
      <div className="space-y-2.5 pl-4 sm:pl-6 border-l-2 border-slate-200 dark:border-zinc-800 py-1 font-sans text-slate-700 dark:text-zinc-350">
        {/* Full Name */}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1 items-start">
          <span className="font-bold text-slate-800 dark:text-zinc-200">1. Full Name:</span>
          <div>
            {isUndertakingEditable ? (
              <input 
                type="text" 
                value={undertakingData.fullName || ''}
                onChange={(e) => handleUpdateUndertakingField('fullName', e.target.value)}
                className="w-full max-w-[400px] bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="[Full Name]"
              />
            ) : (
              <span className="font-bold text-teal-600 dark:text-teal-400">{undertakingData.fullName || '______________________'}</span>
            )}
          </div>
        </div>

        {/* Passport Number */}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1 items-start">
          <span className="font-bold text-slate-800 dark:text-zinc-200">2. Passport Number:</span>
          <div>
            {isUndertakingEditable ? (
              <input 
                type="text" 
                value={undertakingData.passportNumber || ''}
                onChange={(e) => handleUpdateUndertakingField('passportNumber', e.target.value)}
                className="w-full max-w-[200px] bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 font-semibold text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="[Passport Number]"
              />
            ) : (
              <span className="font-semibold text-slate-900 dark:text-zinc-100">{undertakingData.passportNumber || '___________'}</span>
            )}
          </div>
        </div>

        {/* Nationality */}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1 items-start">
          <span className="font-bold text-slate-800 dark:text-zinc-200">3. Nationality:</span>
          <div>
            {isUndertakingEditable ? (
              <input 
                type="text" 
                value={undertakingData.nationality || ''}
                onChange={(e) => handleUpdateUndertakingField('nationality', e.target.value)}
                className="w-full max-w-[200px] bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                placeholder="[Nationality]"
              />
            ) : (
              <span className="text-slate-900 dark:text-zinc-100">{undertakingData.nationality || '_______'}</span>
            )}
          </div>
        </div>

        {/* Date of Birth */}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1 items-start">
          <span className="font-bold text-slate-800 dark:text-zinc-200">4. Date of Birth:</span>
          <div>
            {isUndertakingEditable ? (
              <input 
                type="text" 
                value={undertakingData.dob || ''}
                onChange={(e) => handleUpdateUndertakingField('dob', e.target.value)}
                className="w-full max-w-[200px] bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 text-slate-900 dark:text-zinc-105 focus:outline-none focus:border-blue-500"
                placeholder="[DD/MM/YYYY]"
              />
            ) : (
              <span className="text-slate-900 dark:text-zinc-100">{undertakingData.dob || '__________'}</span>
            )}
          </div>
        </div>

        {/* Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1 items-start">
          <span className="font-bold text-slate-800 dark:text-zinc-200">5. Gender:</span>
          <div>
            {isUndertakingEditable ? (
              <select 
                value={undertakingData.gender || ''}
                onChange={(e) => handleUpdateUndertakingField('gender', e.target.value)}
                className="w-full max-w-[200px] bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
              >
                <option value="">-- Choose Gender --</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            ) : (
              <span className="text-slate-900 dark:text-zinc-100 font-semibold">{undertakingData.gender || '__________'}</span>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1 items-start">
          <span className="font-bold text-slate-800 dark:text-zinc-200">6. Address:</span>
          <div>
            {isUndertakingEditable ? (
              <textarea 
                rows={2}
                value={undertakingData.address || ''}
                onChange={(e) => handleUpdateUndertakingField('address', e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-dashed border-slate-350 dark:border-zinc-700 rounded p-1.5 text-slate-905 dark:text-zinc-100 focus:outline-none focus:border-blue-500 resize-none font-sans leading-relaxed"
                placeholder="[Full Address]"
              />
            ) : (
              <div className="w-full text-slate-900 dark:text-zinc-100 font-sans leading-relaxed whitespace-pre-wrap">
                {undertakingData.address || '____________________________________________________________________'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="italic text-xs pt-1 text-slate-550 dark:text-zinc-400">
        hereby solemnly declare and undertake as follows:
      </div>
    </div>
  );
}
