import React from 'react';
import { FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SuggestionInput } from './SuggestionInput';
import { UndertakingFormData } from '../types';

interface UndertakingOptionsProps {
  utPurpose: string;
  setUtPurpose: (val: string) => void;
  utHospitalName: string;
  setUtHospitalName: (val: string) => void;
  utDoctorName: string;
  setUtDoctorName: (val: string) => void;
  utEmbassyCity: string;
  setUtEmbassyCity: (val: string) => void;
  utEmbassyDate: string;
  setUtEmbassyDate: (val: string) => void;
  utFromDate: string;
  setUtFromDate: (val: string) => void;
  utToDate: string;
  setUtToDate: (val: string) => void;
  utReturnCountry: string;
  isUndertakingConfigured: boolean;
  undertakingData: UndertakingFormData | null;
  setUndertakingData: (data: UndertakingFormData | null) => void;
  savedHospitals: string[];
  handleAddHospitalSuggestion: (name: string) => void;
  savedDepartments: string[];
  handleAddDepartmentSuggestion: (name: string) => void;
}

export function UndertakingOptions({
  utPurpose,
  setUtPurpose,
  utHospitalName,
  setUtHospitalName,
  utDoctorName,
  setUtDoctorName,
  utEmbassyCity,
  setUtEmbassyCity,
  utEmbassyDate,
  setUtEmbassyDate,
  utFromDate,
  setUtFromDate,
  utToDate,
  setUtToDate,
  utReturnCountry,
  isUndertakingConfigured,
  undertakingData,
  setUndertakingData,
  savedHospitals,
  handleAddHospitalSuggestion,
  savedDepartments,
  handleAddDepartmentSuggestion,
}: UndertakingOptionsProps) {
  return (
    <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-4 space-y-3 shadow-sm text-left">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/50 pb-2">
        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-blue-500" />
          Under Taking Option (Optional)
        </span>
        {isUndertakingConfigured && (
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* 1. Purpose of Visit */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
            Purpose of Visit
          </label>
          <select
            value={utPurpose}
            onChange={(e) => setUtPurpose(e.target.value)}
            className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">-- Select Purpose (Optional) --</option>
            <option value="Tourism">Tourism</option>
            <option value="Business">Business</option>
            <option value="Medical Treatment - Patient">Medical Treatment - Patient</option>
            <option value="Medical Treatment - Attendance">Medical Treatment - Attendance</option>
            <option value="Double Entry">Double Entry</option>
          </select>
        </div>

        {/* Conditional Medical / Double Entry Sub-fields */}
        <AnimatePresence mode="popLayout">
          {(utPurpose === 'Medical Treatment - Patient' || utPurpose === 'Medical Treatment - Attendance') && (
            <motion.div
              key="medical-fields"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-zinc-800/50 overflow-visible"
            >
              <div className="relative z-20">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Hospital Name
                </label>
                <SuggestionInput
                  value={utHospitalName}
                  onChange={(val) => {
                    setUtHospitalName(val);
                    if (undertakingData) {
                      setUndertakingData({ ...undertakingData, hospitalName: val });
                    }
                  }}
                  suggestions={savedHospitals}
                  onAddSuggestion={handleAddHospitalSuggestion}
                  placeholder="e.g. Apollo Hospital, Chennai"
                  className="text-emerald-650 dark:text-emerald-450"
                />
              </div>
              <div className="relative z-10">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Department Name
                </label>
                <SuggestionInput
                  value={utDoctorName}
                  onChange={(val) => {
                    setUtDoctorName(val);
                    if (undertakingData) {
                      setUndertakingData({ ...undertakingData, doctorName: val });
                    }
                  }}
                  suggestions={savedDepartments}
                  onAddSuggestion={handleAddDepartmentSuggestion}
                  placeholder="e.g. Cardiology"
                  className="text-emerald-650 dark:text-emerald-450"
                />
              </div>
            </motion.div>
          )}

          {utPurpose === 'Double Entry' && (
            <motion.div
              key="double-entry-fields"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-zinc-800/50 overflow-hidden"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Embassy City (Presenting Location)
                </label>
                <input
                  type="text"
                  value={utEmbassyCity}
                  onChange={(e) => {
                    setUtEmbassyCity(e.target.value);
                    if (undertakingData) {
                      setUndertakingData({ ...undertakingData, embassyCity: e.target.value });
                    }
                  }}
                  placeholder="Delhi"
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Embassy Face Date (Appointment)
                </label>
                <input
                  type="date"
                  value={utEmbassyDate}
                  onChange={(e) => {
                    setUtEmbassyDate(e.target.value);
                    if (undertakingData) {
                      const formattedDate = e.target.value ? new Date(e.target.value).toLocaleDateString('en-GB') : '';
                      setUndertakingData({ ...undertakingData, embassyDate: formattedDate });
                    }
                  }}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans cursor-pointer"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Duration of Stay */}
        {utPurpose !== 'Double Entry' && utPurpose !== 'Tourism' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                India Jabo (From)
              </label>
              <input
                type="date"
                value={utFromDate}
                onChange={(e) => setUtFromDate(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                Ferot Asbo (To)
              </label>
              <input
                type="date"
                value={utToDate}
                onChange={(e) => setUtToDate(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {utPurpose === 'Tourism' && (
          <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-2.5">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
              Duration of Stay (Visa Dependent)
            </p>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal italic">
              ভ্রমণের তারিখ ও স্থায়িত্বকাল নির্দিষ্ট নয়। এটি সম্পূর্ণভাবে ভিসা পাওয়ার পর নির্ধারণ করা হবে।
            </p>
          </div>
        )}

        {/* 3. Return to Home Country */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
            Return to Home Country
          </label>
          <select
            disabled
            value={utReturnCountry}
            className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 cursor-not-allowed text-left"
          >
            <option value="Bangladesh">Bangladesh (Always)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
