import React from 'react';
import { CheckCircle2, Check, Copy, Download, FileText } from 'lucide-react';
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
  const isExpiryWarning = (() => {
    if (!data.expiryDate) return false;
    const expiry = new Date(data.expiryDate);
    if (isNaN(expiry.getTime())) return false; // Invalid date
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    return expiry < sixMonthsFromNow;
  })();

  return (
    <>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold flex flex-wrap items-center gap-2 text-slate-800 dark:text-zinc-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span>Passport Data</span>
            {data.extractionTime ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/40 shadow-sm font-sans">
                ⚡ Processed in {data.extractionTime.toFixed(2)}s
              </span>
            ) : null}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Verified extracted elements from passport page scan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
          <button 
            onClick={handleCopyAll}
            className="slide-btn slide-btn-slate flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg cursor-pointer"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 relative z-10" />
            ) : (
              <Copy className="w-3.5 h-3.5 relative z-10" />
            )}
            <span className="relative z-10">{isCopied ? "Copied" : "Copy All"}</span>
          </button>
          <button 
            onClick={handleDownloadText}
            className="slide-btn slide-btn-slate flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Download TXT</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="slide-btn slide-btn-orange flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Download</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
        <DataField label="EMAIL" value={getGeneratedEmail(data)} highlight onValueChange={(val) => updateDataField('email', val)} />
        <DataField label="DOB" value={data.dob} onValueChange={(val) => updateDataField('dob', val)} />
        
        <DataField label="Gender" value={data.gender || ''} onValueChange={(val) => updateDataField('gender', val)} />
        <div className="hidden sm:block"></div>
        
        <DataField label="Surname" value={data.surname} onValueChange={(val) => updateDataField('surname', val)} />
        <DataField label="Given Name" value={data.givenName} onValueChange={(val) => updateDataField('givenName', val)} />
        
        <DataField label="Town/City of birth/BIRTH PLACE" value={data.birthPlace} onValueChange={(val) => updateDataField('birthPlace', val)} />
        <DataField label="National Id No/BIRTH CERTIFICATE NO" value={data.nidOrBirthCertNumber} onValueChange={(val) => updateDataField('nidOrBirthCertNumber', val)} />
        <DataField label="Passport Number" value={data.passportNumber} highlight onValueChange={(val) => updateDataField('passportNumber', val)} />
        <DataField label="Place of Issue" value={data.placeOfIssue || "DHAKA"} onValueChange={(val) => updateDataField('placeOfIssue', val)} />
        <DataField label="Date of Issue" value={data.issueDate} onValueChange={(val) => updateDataField('issueDate', val)} />
        <DataField label="Date of Expiry" value={data.expiryDate} warning={isExpiryWarning} onValueChange={(val) => updateDataField('expiryDate', val)} />
        
        <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50"></div>
        
        <div className="col-span-1 sm:col-span-2 flex justify-between items-center pb-1">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Address Profile</h4>
        </div>

        <div className="col-span-1 sm:col-span-2 space-y-3">
          <DataField 
            label="Present Address" 
            value={data.presentAddress || ''} 
            onValueChange={(val) => updateDataField('presentAddress', val)} 
          />
          <DataField 
            label="Permanent Address (Extracted from Passport)" 
            value={data.permanentAddress || ''} 
            onValueChange={(val) => updateDataField('permanentAddress', val)} 
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
      </div>
    </>
  );
}
