import React from 'react';
import { UndertakingFormData } from '../../types';

interface PurposeSectionProps {
  undertakingData: UndertakingFormData;
  isUndertakingEditable: boolean;
  handleUpdateUndertakingField: (field: keyof UndertakingFormData, value: string) => void;
}

export function PurposeSection({
  undertakingData,
  isUndertakingEditable,
  handleUpdateUndertakingField
}: PurposeSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-slate-800 dark:text-zinc-100 tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
        <span className="text-blue-500 font-mono">2.</span> Purpose of Visit
      </h3>
      
      <div className="pl-4 sm:pl-6 space-y-3 font-sans text-slate-705 dark:text-zinc-350">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>My Purpose of Visit to India is</span>
          {isUndertakingEditable ? (
            <select
              value={undertakingData.purpose || ''}
              onChange={(e) => handleUpdateUndertakingField('purpose', e.target.value)}
              className="min-w-[150px] bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 text-slate-900 dark:text-zinc-105 focus:outline-none focus:border-blue-500 cursor-pointer font-semibold"
            >
              <option value="Tourism">Tourism</option>
              <option value="Business">Business</option>
              <option value="Medical Treatment - Patient">Medical Treatment - Patient</option>
              <option value="Medical Treatment - Attendance">Medical Treatment - Attendance</option>
              <option value="Double Entry">Double Entry</option>
            </select>
          ) : (
            <span className="font-bold underline decoration-dashed decoration-slate-400 px-2 text-slate-900 dark:text-zinc-100">{undertakingData.purpose || '_______________'}</span>
          )}
          <span>.</span>
        </div>

        {/* Dynamic purpose-specific expanded clause */}
        {undertakingData.purpose === 'Medical Treatment - Patient' && (
          <div className="text-xs leading-relaxed text-slate-650 dark:text-zinc-350 pl-4 border-l-2 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 py-1.5 rounded max-w-2xl">
            {isUndertakingEditable ? (
              <>
                I will be visiting a specific medical facility, namely{' '}
                <input
                  type="text"
                  value={undertakingData.hospitalName || ''}
                  onChange={(e) => handleUpdateUndertakingField('hospitalName', e.target.value)}
                  className="bg-transparent border-b border-dashed border-emerald-400 px-1 font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none min-w-[200px]"
                  placeholder="Hospital Name"
                />{' '}
                and receiving treatment there in the{' '}
                <input
                  type="text"
                  value={undertakingData.doctorName || ''}
                  onChange={(e) => handleUpdateUndertakingField('doctorName', e.target.value)}
                  className="bg-transparent border-b border-dashed border-emerald-400 px-1 font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none min-w-[150px]"
                  placeholder="Department Name"
                />{' '}
                Department. The appointment was made at that specific hospital, and I will not go to any other hospital.
              </>
            ) : (
              <>
                {undertakingData.hospitalName && undertakingData.doctorName ? (
                  <>
                    I will be visiting a specific medical facility, namely{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.hospitalName}</span>{' '}
                    and receiving treatment there in the{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.doctorName}</span>{' '}
                    Department. The appointment was made at that specific hospital, and I will not go to any other hospital.
                  </>
                ) : undertakingData.hospitalName ? (
                  <>
                    I will be visiting a specific medical facility, namely{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.hospitalName}</span>{' '}
                    and receiving treatment there. The appointment was made at that specific hospital, and I will not go to any other hospital.
                  </>
                ) : (
                  <>
                    I will be receiving medical treatment in the{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.doctorName}</span>{' '}
                    Department. The appointment was made at that specific department, and I will not go to any other hospital.
                  </>
                )}
              </>
            )}
          </div>
        )}

        {undertakingData.purpose === 'Medical Treatment - Attendance' && (
          <div className="text-xs leading-relaxed text-slate-650 dark:text-zinc-350 pl-4 border-l-2 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 py-1.5 rounded max-w-2xl">
            {isUndertakingEditable ? (
              <>
                I will be visiting a specific medical facility, namely{' '}
                <input
                  type="text"
                  value={undertakingData.hospitalName || ''}
                  onChange={(e) => handleUpdateUndertakingField('hospitalName', e.target.value)}
                  className="bg-transparent border-b border-dashed border-emerald-400 px-1 font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none min-w-[200px]"
                  placeholder="Hospital Name"
                />{' '}
                and attending to a patient receiving treatment there in the{' '}
                <input
                  type="text"
                  value={undertakingData.doctorName || ''}
                  onChange={(e) => handleUpdateUndertakingField('doctorName', e.target.value)}
                  className="bg-transparent border-b border-dashed border-emerald-400 px-1 font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none min-w-[150px]"
                  placeholder="Department Name"
                />{' '}
                Department. The appointment was made at that specific hospital, and we will not go to any other hospital.
              </>
            ) : (
              <>
                {undertakingData.hospitalName && undertakingData.doctorName ? (
                  <>
                    I will be visiting a specific medical facility, namely{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.hospitalName}</span>{' '}
                    and attending to a patient receiving treatment there in the{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.doctorName}</span>{' '}
                    Department. The appointment was made at that specific hospital, and we will not go to any other hospital.
                  </>
                ) : undertakingData.hospitalName ? (
                  <>
                    I will be visiting a specific medical facility, namely{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.hospitalName}</span>{' '}
                    and attending to a patient receiving treatment there. The appointment was made at that specific hospital, and we will not go to any other hospital.
                  </>
                ) : (
                  <>
                    I will be attending to a patient receiving medical treatment in the{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.doctorName}</span>{' '}
                    Department. The appointment was made at that specific department, and we will not go to any other hospital.
                  </>
                )}
              </>
            )}
          </div>
        )}

        {undertakingData.purpose === 'Double Entry' && (
          <div className="text-xs leading-relaxed text-slate-650 dark:text-zinc-350 pl-4 border-l-2 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 py-2.5 rounded max-w-2xl">
            I will travel to{' '}
            {isUndertakingEditable ? (
              <input
                type="text"
                value={undertakingData.embassyCity || ''}
                onChange={(e) => handleUpdateUndertakingField('embassyCity', e.target.value)}
                className="bg-transparent border-b border-dashed border-emerald-400 px-1 font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none min-w-[100px]"
                placeholder="Embassy City"
              />
            ) : (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.embassyCity || 'Delhi'}</span>
            )}{' '}
            in order to present myself and submit my application at the designated Embassy/High Commission for my scheduled consular appointment on{' '}
            {isUndertakingEditable ? (
              <input
                type="date"
                value={
                  undertakingData.embassyDate 
                    ? undertakingData.embassyDate.split('/').reverse().join('-') 
                    : ''
                }
                onChange={(e) => {
                  const formatted = e.target.value ? new Date(e.target.value).toLocaleDateString('en-GB') : '';
                  handleUpdateUndertakingField('embassyDate', formatted);
                }}
                className="bg-slate-50 dark:bg-zinc-800 border-b border-amber-500 px-2 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 focus:outline-none cursor-pointer"
              />
            ) : (
              <span className="font-extrabold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 text-xs italic">
                {undertakingData.embassyDate || '_________________'}
              </span>
            )}
            .
          </div>
        )}

        {undertakingData.purpose === 'Business' && (
          <div className="text-xs leading-relaxed text-slate-650 dark:text-zinc-350 pl-4 border-l-2 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 py-1.5 rounded max-w-2xl">
            I further clarify that my travel is solely intended for executing authorized commercial activities and business operations.
          </div>
        )}
      </div>
    </div>
  );
}
