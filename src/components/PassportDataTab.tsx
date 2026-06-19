import React from 'react';
import { CheckCircle2, Check, Copy, Download, FileText, Printer, Sparkles } from 'lucide-react';
import { PassportData } from '../types';
import { DataField } from './DataField';
import {
  getGeneratedEmail,
  getProprietorBusinessName,
  getJobCompanyName,
  getJobRole
} from '../utils/addressUtils';

interface PassportDataTabProps {
  data: PassportData;
  updateDataField: (field: keyof PassportData, value: string) => void;
  handleCopyAll: () => void;
  handleDownloadText: () => void;
  handleDownloadPDF: () => void;
  isCopied: boolean;
  isGeneratingAddresses?: boolean;
  onGenerateAddresses?: () => void;
}

export function PassportDataTab({
  data,
  updateDataField,
  handleCopyAll,
  handleDownloadText,
  handleDownloadPDF,
  isCopied,
  isGeneratingAddresses = false,
  onGenerateAddresses
}: PassportDataTabProps) {
  return (
    <>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            Passport Data
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Verified extracted elements from passport page scan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
          <button 
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-transparent dark:border-zinc-700 cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? "Copied" : "Copy All"}
          </button>
          <button 
            onClick={handleDownloadText}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download TXT
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF8006] hover:bg-[#FF8006]/90 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95 duration-100 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Download PDF Summary
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C8493] hover:bg-[#0C8493]/90 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95 duration-100 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
        <DataField label="EMAIL" value={getGeneratedEmail(data)} highlight onValueChange={(val) => updateDataField('email', val)} />
        <DataField label="DOB" value={data.dob} onValueChange={(val) => updateDataField('dob', val)} />
        <DataField label="Gender" value={data.gender || ''} onValueChange={(val) => updateDataField('gender', val)} />
        <DataField label="Blood Group" value="Unknown" />
        <DataField label="Surname" value={data.surname} onValueChange={(val) => updateDataField('surname', val)} />
        <DataField label="Given Name" value={data.givenName} onValueChange={(val) => updateDataField('givenName', val)} />
        <DataField label="Town/City of birth/BIRTH PLACE" value={data.birthPlace} onValueChange={(val) => updateDataField('birthPlace', val)} />
        <DataField label="National Id No/BIRTH CERTIFICATE NO" value={data.nidOrBirthCertNumber} onValueChange={(val) => updateDataField('nidOrBirthCertNumber', val)} />
        <DataField label="Passport Number" value={data.passportNumber} highlight onValueChange={(val) => updateDataField('passportNumber', val)} />
        <DataField label="Place of Issue" value={data.placeOfIssue || "DHAKA"} onValueChange={(val) => updateDataField('placeOfIssue', val)} />
        <DataField label="Date of Issue" value={data.issueDate} onValueChange={(val) => updateDataField('issueDate', val)} />
        <DataField label="Date of Expiry" value={data.expiryDate} onValueChange={(val) => updateDataField('expiryDate', val)} />
        
        <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50"></div>
        
        <div className="col-span-1 sm:col-span-2 flex justify-between items-center pb-1">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Address Profile</h4>
          {onGenerateAddresses && (
            <button 
              onClick={onGenerateAddresses}
              disabled={isGeneratingAddresses || !data.permanentAddress}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/50 hover:border-teal-300 transition duration-150 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed print:hidden cursor-pointer"
              title="Auto-generates Present, Business, and Office addresses using Gemini AI based on permanent address categorization."
            >
              {isGeneratingAddresses ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-current animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
                  Auto-Gen from Permanent Address
                </>
              )}
            </button>
          )}
        </div>

        <div className="col-span-1 sm:col-span-2 space-y-3">
          <DataField 
            label="Permanent Address (Extracted from Passport)" 
            value={data.permanentAddress || ''} 
            onValueChange={(val) => updateDataField('permanentAddress', val)} 
          />
          <DataField 
            label="Present Address" 
            value={data.presentAddress || ''} 
            onValueChange={(val) => updateDataField('presentAddress', val)} 
          />
        </div>
        
        <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50"></div>
        
        <div className="col-span-1 sm:col-span-2">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Additional Information</h4>
        </div>
        
        <DataField label="Father's Name" value={data.fatherName} onValueChange={(val) => updateDataField('fatherName', val)} />
        <DataField label="Mother's Name" value={data.motherName} onValueChange={(val) => updateDataField('motherName', val)} />
        <DataField label="Spouse's Name" value={data.spouseName || "N/A"} onValueChange={(val) => updateDataField('spouseName', val)} />
        <DataField label="Mobile Number" value={data.mobileNumber ? data.mobileNumber.replace(/^\+88\s*/, '') : ''} onValueChange={(val) => updateDataField('mobileNumber', val)} />
        <DataField label="District of Birth" value={data.birthPlaceDistrict || data.birthPlace || ''} onValueChange={(val) => updateDataField('birthPlaceDistrict', val)} />

        <div className="col-span-1 sm:col-span-2 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-2">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Business & Profession Details</h4>
        </div>
        
        <div className="col-span-1 sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Proprietorship */}
          <div className="space-y-3 bg-slate-50/50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
            <h5 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800/50 pb-2 mb-1">Business (Proprietorship)</h5>
            <DataField label="Business Name" value={getProprietorBusinessName(data)} onValueChange={(val) => updateDataField('proprietorBusinessName', val)} />
            <DataField label="Designation" value="Proprietor" />
            <DataField label="Business Address (Present / Dhaka)" value={data.businessAddressDhaka || ''} onValueChange={(val) => updateDataField('businessAddressDhaka', val)} />
            <DataField label="Business Address (Permanent / Local)" value={data.businessAddressLocal || ''} onValueChange={(val) => updateDataField('businessAddressLocal', val)} />
          </div>

          {/* Private Service / Job */}
          <div className="space-y-3 bg-slate-50/50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
            <h5 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800/50 pb-2 mb-1">Private Service / Job</h5>
            <DataField label="Company Name" value={getJobCompanyName(data)} onValueChange={(val) => updateDataField('jobCompanyName', val)} />
            <DataField label="Designation" value={getJobRole(data)} onValueChange={(val) => updateDataField('jobRole', val)} />
            <DataField label="Office Address (Present / Dhaka)" value={data.officeAddressDhaka || ''} onValueChange={(val) => updateDataField('officeAddressDhaka', val)} />
            <DataField label="Office Address (Permanent / Local)" value={data.officeAddressLocal || ''} onValueChange={(val) => updateDataField('officeAddressLocal', val)} />
          </div>
        </div>

        {/* Multi-Agent Collaboration Log Panel */}
        {data.agentLog && (
          <div className="col-span-1 sm:col-span-2 mt-6 bg-[#0C8493]/5 dark:bg-[#0C8493]/10 border border-[#0C8493]/20 rounded-2xl p-5 space-y-4 shadow-sm print:hidden">
            <div className="flex items-center justify-between border-b border-[#0C8493]/25 pb-3">
              <h4 className="text-sm font-black text-[#0C8493] tracking-wide flex items-center gap-1.5 font-sans">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                Multi-Agent System Insights & Conversation Log
              </h4>
              {data.discrepancyList && data.discrepancyList.length > 0 ? (
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-[#FF8006] text-[10px] font-black rounded-full uppercase tracking-wider border border-amber-500/20 font-sans">
                  Warnings Flagged
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-500/20 font-sans">
                  Perfect Validation
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Agent conversation logs */}
              <div className="bg-white/80 dark:bg-zinc-950/60 p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 shadow-inner flex flex-col">
                <h5 className="text-[11px] font-black text-slate-400 dark:text-zinc-500 mb-2.5 uppercase tracking-wider font-mono">🤖 Coordinated Sub-Agent Communication:</h5>
                <div className="text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                  {data.agentLog}
                </div>
              </div>

              {/* Sub-Agent D Draft & Discrepancies */}
              <div className="flex flex-col gap-3.5">
                {data.discrepancyList && data.discrepancyList.length > 0 ? (
                  <div className="bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                    <h5 className="text-[11px] font-black text-amber-800 dark:text-amber-400 mb-2 uppercase tracking-wider font-mono flex items-center gap-1">
                      ⚠️ Mismatch Warnings (QA Agent C):
                    </h5>
                    <ul className="text-xs text-amber-700 dark:text-amber-350 list-disc pl-4 space-y-1.5">
                      {data.discrepancyList.map((item, idx) => (
                        <li key={idx} className="font-semibold leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                    <h5 className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 mb-1 uppercase tracking-wider font-mono">
                      ✅ Integrity Verification
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans font-medium leading-relaxed">
                      Sub-Agent C conducted an interface scan. Zero discrepancies found between visual data and printed Machine Readable Zone (MRZ).
                    </p>
                  </div>
                )}

                {data.customUndertakingDraft && (
                  <div className="bg-slate-50/50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/50 flex-1 flex flex-col">
                    <h5 className="text-[11px] font-black text-[#0C8493] dark:text-[#0C8493] mb-2 uppercase tracking-wider font-mono">✍️ Custom Draft Declaration (Agent D):</h5>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 font-serif italic leading-relaxed whitespace-pre-wrap flex-1 scroll-smooth">
                      "{data.customUndertakingDraft}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
