import React from 'react';
import { CheckCircle2, Check, Copy, Download, FileText, Printer } from 'lucide-react';
import { PassportData } from '../types';
import { DataField } from './DataField';
import {
  getPresentAddress,
  getPermanentAddress,
  getDistrictFromAddress,
  getGeneratedEmail,
  getProprietorBusinessName,
  getJobCompanyName,
  getJobRole,
  getBusinessAddressDhaka,
  getOfficeAddressDhaka,
  getBusinessAddressLocal,
  getOfficeAddressLocal
} from '../utils/addressUtils';

interface PassportDataTabProps {
  data: PassportData;
  updateDataField: (field: keyof PassportData, value: string) => void;
  handleCopyAll: () => void;
  handleDownloadText: () => void;
  handleDownloadPDF: () => void;
  isCopied: boolean;
}

export function PassportDataTab({
  data,
  updateDataField,
  handleCopyAll,
  handleDownloadText,
  handleDownloadPDF,
  isCopied
}: PassportDataTabProps) {
  const presentAddr = getPresentAddress(data);
  const permanentAddr = getPermanentAddress(data);

  return (
    <>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            Passport Data
          </h2>
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
        
        <div className="col-span-1 sm:col-span-2">
           <DataField label="PRESENT ADDRESS" value={presentAddr} onValueChange={(val) => updateDataField('presentAddress', val)} />
        </div>
        <div className="col-span-1 sm:col-span-2">
           <DataField label="PERMANENT ADDRESS" value={permanentAddr} onValueChange={(val) => updateDataField('permanentAddress', val)} />
        </div>

        <div className="col-span-1 sm:col-span-2 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-2">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Additional Information</h4>
        </div>
        
        <DataField label="Father's Name" value={data.fatherName} onValueChange={(val) => updateDataField('fatherName', val)} />
        <DataField label="Mother's Name" value={data.motherName} onValueChange={(val) => updateDataField('motherName', val)} />
        <DataField label="Spouse's Name" value={data.spouseName || "N/A"} onValueChange={(val) => updateDataField('spouseName', val)} />
        <DataField label="Mobile Number" value={data.mobileNumber ? data.mobileNumber.replace(/^\+88\s*/, '') : ''} onValueChange={(val) => updateDataField('mobileNumber', val)} />
        <DataField label="Town/City of birth/BIRTH PLACE" value={getDistrictFromAddress(permanentAddr, data)} onValueChange={(val) => updateDataField('birthPlaceDistrict', val)} />

        <div className="col-span-1 sm:col-span-2 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-2">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Business & Profession Details</h4>
        </div>
        
        <div className="col-span-1 sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Proprietorship */}
          <div className="space-y-3 bg-slate-50/50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
            <h5 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800/50 pb-2 mb-1">Business (Proprietorship)</h5>
            <DataField label="Business Name" value={getProprietorBusinessName(data)} onValueChange={(val) => updateDataField('proprietorBusinessName', val)} />
            <DataField label="Designation" value="Proprietor" />
            <div className="pt-2">
              <DataField label="Business Address (Present)" value={getBusinessAddressDhaka(presentAddr, data)} onValueChange={(val) => updateDataField('businessAddressDhaka', val)} />
            </div>
            <div className="pt-2">
              <DataField label="Business Address (Permanent)" value={getBusinessAddressLocal(permanentAddr, data)} onValueChange={(val) => updateDataField('businessAddressLocal', val)} />
            </div>
          </div>

          {/* Private Service / Job */}
          <div className="space-y-3 bg-slate-50/50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
            <h5 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800/50 pb-2 mb-1">Private Service / Job</h5>
            <DataField label="Company Name" value={getJobCompanyName(data)} onValueChange={(val) => updateDataField('jobCompanyName', val)} />
            <DataField label="Designation" value={getJobRole(data)} onValueChange={(val) => updateDataField('jobRole', val)} />
            <div className="pt-2">
              <DataField label="Office Address (Present)" value={getOfficeAddressDhaka(presentAddr, data)} onValueChange={(val) => updateDataField('officeAddressDhaka', val)} />
            </div>
            <div className="pt-2">
              <DataField label="Office Address (Permanent)" value={getOfficeAddressLocal(permanentAddr, data)} onValueChange={(val) => updateDataField('officeAddressLocal', val)} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
