import React from 'react';
import { FileText, Eye, Settings, Download } from 'lucide-react';
import { UndertakingFormData } from '../types';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            <FileText className="w-5 h-5 text-teal-600" />
            {isUndertakingEditable ? "Edit Visa Undertaking Document" : "Preview Visa Undertaking Document"}
          </h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium font-sans">
            {isUndertakingEditable 
              ? "Click on any text or blank line below to edit before downloading." 
              : "This is an elegant read-only live preview of your final undertaking document."
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Switch */}
          <div className="bg-slate-100 dark:bg-zinc-800/50 p-1 rounded-lg flex items-center gap-1 text-xs border border-slate-200 dark:border-zinc-700/60 print:hidden">
            <button
              onClick={() => setIsUndertakingEditable(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                !isUndertakingEditable
                  ? 'bg-white dark:bg-zinc-900 shadow-sm text-teal-650 dark:text-teal-400 font-extrabold border border-slate-205 dark:border-zinc-800'
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-350'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => setIsUndertakingEditable(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                isUndertakingEditable
                  ? 'bg-white dark:bg-zinc-900 shadow-sm text-teal-650 dark:text-teal-400 font-extrabold border border-slate-205 dark:border-zinc-800'
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-350'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>

          <button
            onClick={handleDownloadUndertaking}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FF8006] hover:bg-[#FF8006]/90 text-white text-xs sm:text-sm font-bold rounded-lg transition-all shadow-sm active:scale-95 duration-100 cursor-pointer self-start sm:self-auto print:hidden"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 p-6 sm:p-12 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-inner font-serif text-slate-900 dark:text-zinc-100 text-xs sm:text-sm space-y-6 leading-relaxed relative print:border-none print:shadow-none print:p-0">
        <div className="text-center font-bold text-base sm:text-lg uppercase tracking-wide border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-6">
          Undertaking Form
        </div>

        <div className="space-y-6 pt-2">
          {/* Introductory declaration */}
          <div className="text-slate-700 dark:text-zinc-300 italic">
            I, the undersigned, hereby submit this undertaking in support of my application for an Indian visa.
          </div>

          {/* Section 1. Personal Details */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
              <span className="text-blue-500 font-mono">1.</span> Personal Details
            </h3>
            
            <div className="space-y-2.5 pl-4 sm:pl-6 border-l-2 border-slate-200 dark:border-zinc-800 py-1 font-serif text-slate-700 dark:text-zinc-350">
              {/* Point 1: Full Name */}
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

              {/* Point 2: Passport Number */}
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

              {/* Point 3: Nationality */}
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

              {/* Point 4: Date of Birth */}
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

              {/* Point 5: Gender */}
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

              {/* Point 6: Address */}
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1 items-start">
                <span className="font-bold text-slate-800 dark:text-zinc-200">6. Address:</span>
                <div>
                  {isUndertakingEditable ? (
                    <textarea 
                      rows={2}
                      value={undertakingData.address || ''}
                      onChange={(e) => handleUpdateUndertakingField('address', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-dashed border-slate-350 dark:border-zinc-700 rounded p-1.5 text-slate-905 dark:text-zinc-100 focus:outline-none focus:border-blue-500 resize-none font-serif leading-relaxed"
                      placeholder="[Full Address]"
                    />
                  ) : (
                    <div className="w-full text-slate-900 dark:text-zinc-100 font-serif leading-relaxed whitespace-pre-wrap">
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

          {/* Section 2. Purpose of Visit */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
              <span className="text-blue-500 font-mono">2.</span> Purpose of Visit
            </h3>
            
            <div className="pl-4 sm:pl-6 space-y-3 font-serif text-slate-705 dark:text-zinc-350">
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
                (() => {
                  const hasHospital = !!undertakingData.hospitalName?.trim();
                  const hasDept = !!undertakingData.doctorName?.trim();
                  if (!isUndertakingEditable && !hasHospital && !hasDept) return null;
                  return (
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
                          {hasHospital && hasDept ? (
                            <>
                              I will be visiting a specific medical facility, namely{' '}
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.hospitalName}</span>{' '}
                              and receiving treatment there in the{' '}
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.doctorName}</span>{' '}
                              Department. The appointment was made at that specific hospital, and I will not go to any other hospital.
                            </>
                          ) : hasHospital ? (
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
                  );
                })()
              )}

              {undertakingData.purpose === 'Medical Treatment - Attendance' && (
                (() => {
                  const hasHospital = !!undertakingData.hospitalName?.trim();
                  const hasDept = !!undertakingData.doctorName?.trim();
                  if (!isUndertakingEditable && !hasHospital && !hasDept) return null;
                  return (
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
                          {hasHospital && hasDept ? (
                            <>
                              I will be visiting a specific medical facility, namely{' '}
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.hospitalName}</span>{' '}
                              and attending to a patient receiving treatment there in the{' '}
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 underline decoration-dotted">{undertakingData.doctorName}</span>{' '}
                              Department. The appointment was made at that specific hospital, and we will not go to any other hospital.
                            </>
                          ) : hasHospital ? (
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
                  );
                })()
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

          {/* Section 3. Duration of Stay */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
              <span className="text-blue-500 font-mono">3.</span> Duration of Stay
            </h3>
            
            <div className="pl-4 sm:pl-6 text-sm font-serif text-slate-700 dark:text-zinc-350 leading-relaxed">
              {undertakingData.purpose.toLowerCase().includes('medical') ? (
                <div className="italic text-slate-800 dark:text-zinc-200 font-medium bg-blue-50/50 dark:bg-zinc-900/30 p-2.5 rounded border border-slate-100 dark:border-zinc-800 max-w-2xl">
                  "The exact duration and dates of my stay in India will depend entirely upon the medical treatment requirements, progress, and schedule as prescribed and advised by the consulting hospital and medical specialists."
                </div>
              ) : undertakingData.purpose === 'Double Entry' ? (
                <div className="italic text-slate-800 dark:text-zinc-250 font-semibold bg-amber-500/5 dark:bg-zinc-900/30 p-3 rounded-lg border border-amber-200 dark:border-zinc-800 max-w-2xl leading-relaxed">
                  "My scheduled embassy appointment is on <span className="font-bold text-amber-700 dark:text-amber-400 underline decoration-dashed decoration-amber-400">{undertakingData.embassyDate || '_________________'}</span>. 
                  I intend to stay in India solely for the period necessary to complete my consular interview and visa formalities."
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

          {/* Section 4. Return to Home Country */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 tracking-wide border-b border-slate-100 dark:border-zinc-800 pb-1 flex items-center gap-2">
              <span className="text-blue-500 font-mono">4.</span> Return to Home Country
            </h3>
            
            <div className="pl-4 sm:pl-6 text-sm font-serif text-slate-705 dark:text-zinc-350">
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
            
            <div className="pl-4 sm:pl-6 text-justify leading-relaxed font-serif text-slate-600 dark:text-zinc-400 text-xs sm:text-sm">
              I also declare that the details provided here are absolutely true and complete. I will adhere entirely to the rules, regulations, and timelines stipulated by the Embassy of India and the appropriate authorities, and understand that any violations may hold me legally accountable under applicable regulatory provisions.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-zinc-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 font-sans">
          <div className="space-y-1">
            <div className="font-bold text-slate-900 dark:text-zinc-100 font-serif">Signature of Applicant:</div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 italic mt-1">(Physical Signature required on printed copy)</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-zinc-100 font-serif">Date:</span>
            {isUndertakingEditable ? (
              <input 
                type="text" 
                value={undertakingData.date || ''}
                onChange={(e) => handleUpdateUndertakingField('date', e.target.value)}
                className="min-w-[100px] text-center bg-slate-50 dark:bg-zinc-900 border-b border-dashed border-slate-400 dark:border-zinc-700 px-2 py-0.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-bold"
              />
            ) : (
              <span className="font-bold underline decoration-dashed decoration-slate-400 px-2 text-slate-900 dark:text-zinc-100 font-serif">{undertakingData.date || '__________'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
