import React from 'react';
import { UndertakingFormData } from '../types';
import { UndertakingHeader } from './undertaking/UndertakingHeader';
import { PersonalDetailsSection } from './undertaking/PersonalDetailsSection';
import { PurposeSection } from './undertaking/PurposeSection';
import { StayDurationSection } from './undertaking/StayDurationSection';

interface UndertakingFormTabProps {
  undertakingData: UndertakingFormData;
  isUndertakingEditable: boolean;
  setIsUndertakingEditable: (editable: boolean) => void;
  handleUpdateUndertakingField: (field: keyof UndertakingFormData, value: string) => void;
  handleDownloadUndertaking: () => void;
}

export function UndertakingFormTab({
  undertakingData,
  isUndertakingEditable,
  setIsUndertakingEditable,
  handleUpdateUndertakingField,
  handleDownloadUndertaking
}: UndertakingFormTabProps) {
  return (
    <div className="flex flex-col gap-6 text-left">
      <UndertakingHeader 
        isUndertakingEditable={isUndertakingEditable}
        setIsUndertakingEditable={setIsUndertakingEditable}
        handleDownloadUndertaking={handleDownloadUndertaking}
      />

      <div className="bg-white dark:bg-zinc-950 p-6 sm:p-12 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-inner font-sans text-slate-900 dark:text-zinc-100 text-xs sm:text-sm space-y-6 leading-relaxed relative print:border-none print:shadow-none print:p-0">
        <div className="text-center font-bold text-base sm:text-lg uppercase tracking-wide border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-6">
          Undertaking Form
        </div>

        <div className="space-y-6 pt-2">
          {/* Introductory declaration */}
          <div className="text-slate-700 dark:text-zinc-300 italic">
            I, the undersigned, hereby submit this undertaking in support of my application for an Indian visa.
          </div>

          <PersonalDetailsSection 
            undertakingData={undertakingData}
            isUndertakingEditable={isUndertakingEditable}
            handleUpdateUndertakingField={handleUpdateUndertakingField}
          />

          <PurposeSection 
            undertakingData={undertakingData}
            isUndertakingEditable={isUndertakingEditable}
            handleUpdateUndertakingField={handleUpdateUndertakingField}
          />

          <StayDurationSection 
            undertakingData={undertakingData}
            isUndertakingEditable={isUndertakingEditable}
            handleUpdateUndertakingField={handleUpdateUndertakingField}
          />

          {/* Section 4. Return to Home Country */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
              <span className="text-blue-500 font-mono">4.</span> Return to Home Country
            </h3>
            
            <div className="pl-4 sm:pl-6 text-sm font-sans text-slate-705 dark:text-zinc-350">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>I swear to return to my home country, namely</span>
                {isUndertakingEditable ? (
                  <input 
                    type="text" 
                    value={undertakingData.returnCountry || ''}
                    onChange={(e) => handleUpdateUndertakingField('returnCountry', e.target.value)}
                    className="min-w-[110px] bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-semibold"
                    placeholder="[Return Country]"
                  />
                ) : (
                  <span className="underline decoration-dashed decoration-slate-400 px-2 text-slate-900 dark:text-zinc-100 font-semibold">{undertakingData.returnCountry || '___________'}</span>
                )}
                <span>, upon completion of my authorized stay.</span>
              </div>
            </div>
          </div>

          {/* Section 5. Compliance and Declaration */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
              <span className="text-blue-500 font-mono">5.</span> Compliance with Indian Laws
            </h3>
            
            <div className="pl-4 sm:pl-6 text-justify leading-relaxed font-sans text-slate-600 dark:text-zinc-400 text-xs sm:text-sm">
              I also declare that the details provided here are absolutely true and complete. I will adhere entirely to the rules, regulations, and timelines stipulated by the Embassy of India and the appropriate authorities, and understand that any violations may hold me legally accountable under applicable regulatory provisions.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-zinc-800/50 flex justify-end gap-6 font-sans">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-zinc-100 font-sans">Date:</span>
            {isUndertakingEditable ? (
              <input 
                type="text" 
                value={undertakingData.date || ''}
                onChange={(e) => handleUpdateUndertakingField('date', e.target.value)}
                className="min-w-[100px] text-center bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-bold"
              />
            ) : (
              <span className="font-bold underline decoration-dashed decoration-slate-400 px-2 text-slate-900 dark:text-zinc-100 font-sans">{undertakingData.date || '__________'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
