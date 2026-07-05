import { CheckCircle2, Check, Copy, Download, FileText, Braces } from 'lucide-react';
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
  handleDownloadJSON: () => void;
  isCopied: boolean;
  isGeneratingAddresses?: boolean;
  onGenerateAddresses?: () => void;
  utPurpose?: string;
}

export function PassportDataTab({
  data,
  updateDataField,
  handleCopyAll,
  handleDownloadText,
  handleDownloadPDF,
  handleDownloadJSON,
  isCopied,
  isGeneratingAddresses = false,
  onGenerateAddresses,
  utPurpose
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
            className="slide-btn slide-btn-slate flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg cursor-pointer shadow-sm hover:shadow ripple-btn"
          >
            {isCopied ? (
              <Check className="w-4.5 h-4.5 text-emerald-500 relative z-10 font-bold" />
            ) : (
              <Copy className="w-4.5 h-4.5 relative z-10" />
            )}
            <span className="relative z-10">{isCopied ? "Copied!" : "Copy All"}</span>
          </button>
          <button 
            onClick={handleDownloadText}
            className="slide-btn slide-btn-slate flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg cursor-pointer ripple-btn"
          >
            <Download className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Download TXT</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="slide-btn slide-btn-orange flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg cursor-pointer ripple-btn"
          >
            <FileText className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Download</span>
          </button>
          <button 
            onClick={handleDownloadJSON}
            className="slide-btn slide-btn-slate flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg cursor-pointer ripple-btn"
          >
            <Braces className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
        <DataField label="EMAIL" value={getGeneratedEmail(data)} highlight onValueChange={(val) => updateDataField('email', val)} />
        <DataField label="DOB" value={data.dob} confidence={data.fieldConfidence?.dob} onValueChange={(val) => updateDataField('dob', val)} />
        
        <DataField label="Gender" value={data.gender || ''} confidence={data.fieldConfidence?.gender} onValueChange={(val) => updateDataField('gender', val)} />
        <div className="hidden sm:block"></div>
        
        <DataField label="Surname" value={data.surname} confidence={data.fieldConfidence?.surname} onValueChange={(val) => updateDataField('surname', val)} />
        <DataField label="Given Name" value={data.givenName} confidence={data.fieldConfidence?.givenName} onValueChange={(val) => updateDataField('givenName', val)} />
        
        <DataField label="Town/City of birth/BIRTH PLACE" value={data.birthPlace} confidence={data.fieldConfidence?.birthPlace} onValueChange={(val) => updateDataField('birthPlace', val)} />
        <DataField label="National Id No/BIRTH CERTIFICATE NO" value={data.nidOrBirthCertNumber} confidence={data.fieldConfidence?.nidOrBirthCertNumber} onValueChange={(val) => updateDataField('nidOrBirthCertNumber', val)} />
        <DataField label="Passport Number" value={data.passportNumber} highlight confidence={data.fieldConfidence?.passportNumber} onValueChange={(val) => updateDataField('passportNumber', val)} />
        <DataField label="Place of Issue" value={data.placeOfIssue || "DHAKA"} onValueChange={(val) => updateDataField('placeOfIssue', val)} />
        <DataField label="Date of Issue" value={data.issueDate} confidence={data.fieldConfidence?.issueDate} onValueChange={(val) => updateDataField('issueDate', val)} />
        <DataField label="Date of Expiry" value={data.expiryDate} warning={isExpiryWarning} confidence={data.fieldConfidence?.expiryDate} onValueChange={(val) => updateDataField('expiryDate', val)} />
        
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
            confidence={data.fieldConfidence?.permanentAddress}
            onValueChange={(val) => updateDataField('permanentAddress', val)} 
          />
        </div>
        
        <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50"></div>
        
        <div className="col-span-1 sm:col-span-2">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Additional Information</h4>
        </div>
        
        <DataField label="Father's Name" value={data.fatherName} confidence={data.fieldConfidence?.fatherName} onValueChange={(val) => updateDataField('fatherName', val)} />
        <DataField label="Mother's Name" value={data.motherName} confidence={data.fieldConfidence?.motherName} onValueChange={(val) => updateDataField('motherName', val)} />
        <DataField label="Spouse's Name" value={data.spouseName || "N/A"} confidence={data.fieldConfidence?.spouseName} onValueChange={(val) => updateDataField('spouseName', val)} />
        <DataField label="Mobile Number" value={data.mobileNumber ? data.mobileNumber.replace(/^\+88\s*/, '') : ''} confidence={data.fieldConfidence?.mobileNumber} onValueChange={(val) => updateDataField('mobileNumber', val)} />
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

        {data.hospitalName && (
          <>
            <div className="col-span-1 sm:col-span-2 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-4">
              <h4 className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Medical / Hospital Details
              </h4>
            </div>
            
            <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-pink-500/5 dark:from-rose-950/30 dark:via-rose-950/20 dark:to-pink-950/10 p-5 rounded-2xl border-2 border-rose-500/30 dark:border-rose-500/40 shadow-sm space-y-3.5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                MEDICAL DETAILS
              </div>
              <h5 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 border-b border-rose-200/50 dark:border-zinc-800 pb-2 mb-1 flex items-center gap-1.5 pr-20">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50"></span>
                Hospital Details in India
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-1 md:col-span-2">
                  <DataField label="Hospital Name" value={data.hospitalName || ''} highlight onValueChange={(val) => updateDataField('hospitalName', val)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <DataField label="Hospital Address" value={data.hospitalAddress || ''} highlight onValueChange={(val) => updateDataField('hospitalAddress', val)} />
                </div>
              </div>
            </div>
          </>
        )}

        {data.hotelName && (
          <>
            <div className="col-span-1 sm:col-span-2 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-4">
              <h4 className="text-xs font-bold text-amber-650 dark:text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Indian Reference ({utPurpose === 'Business' ? 'Kolkata Business' : utPurpose === 'Double Entry' ? 'Delhi Hotel' : 'Kolkata Hotel'} Details)
              </h4>
            </div>
            
            <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/5 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-orange-950/10 p-5 rounded-2xl border-2 border-amber-500 dark:border-amber-500/60 shadow-[0_4px_25px_rgba(245,158,11,0.12)] space-y-3.5 relative overflow-hidden group">
              {/* Highlight badge tag */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                {utPurpose === 'Business' ? 'BUSINESS DETAILS' : utPurpose === 'Double Entry' ? 'DELHI HOTEL' : 'KOLKATA HOTEL'}
              </div>

              <h5 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 border-b border-amber-200/50 dark:border-zinc-800 pb-2 mb-1 flex items-center gap-1.5 pr-20">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-sm shadow-amber-500/50"></span>
                {utPurpose === 'Business' ? 'Kolkata Business Details' : `${utPurpose === 'Double Entry' ? 'Delhi' : 'Kolkata'} Hotel Details`} (Reference Name in India)
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-1 md:col-span-2">
                  <DataField label="Reference Name in India" value={data.hotelName || ''} highlight onValueChange={(val) => updateDataField('hotelName', val)} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <DataField label="Address" value={data.hotelAddress || ''} highlight onValueChange={(val) => updateDataField('hotelAddress', val)} />
                </div>
                <DataField label="State" value={data.hotelState || ''} highlight onValueChange={(val) => updateDataField('hotelState', val)} />
                <DataField label="District" value={data.hotelDistrict || ''} highlight onValueChange={(val) => updateDataField('hotelDistrict', val)} />
                <DataField label="Phone" value={data.hotelPhone || ''} highlight onValueChange={(val) => updateDataField('hotelPhone', val)} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
