import React, { useState } from 'react';
import { CheckCircle2, Check, Copy, Download, FileText, Braces, ClipboardList, Share2, Loader2, Calendar } from 'lucide-react';
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
  onOpenRefHelper?: () => void;
  onShare?: () => void;
  isSharing?: boolean;
  utDoctorName?: string;
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
  utPurpose,
  onOpenRefHelper,
  onShare,
  isSharing = false,
  utDoctorName
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

  const helperInfo = (() => {
    if (!utPurpose) return null;
    if (utPurpose === 'Tourism') {
      return {
        label: '🏨 Kolkata Hotels (5)',
        purpose: 'Tourism' as const,
        btnClass: 'slide-btn-orange text-white'
      };
    }
    if (utPurpose === 'Business') {
      return {
        label: 'Kolkata Businesses (5)',
        purpose: 'Business' as const,
        btnClass: 'slide-btn-purple text-white'
      };
    }
    if (utPurpose === 'Medical Treatment - Patient' || utPurpose === 'Medical Treatment - Attendance') {
      return {
        label: 'Hospitals (12)',
        purpose: 'Medical' as const,
        btnClass: 'slide-btn-orange text-white'
      };
    }
    if (utPurpose === 'Double Entry') {
      return {
        label: 'Delhi Hotels (5)',
        purpose: 'DoubleEntry' as const,
        btnClass: 'slide-btn-orange text-white'
      };
    }
    return null;
  })();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between mb-2.5 pb-1.5 border-b border-slate-100 dark:border-zinc-800/50 gap-2 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-1.5 text-slate-800 dark:text-zinc-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Passport Data</span>
          </h2>
          {data.extractionTime ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/40 shadow-xs font-sans">
              ⚡ {data.extractionTime.toFixed(2)}s
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto sm:justify-end">
          {helperInfo && onOpenRefHelper && (
            <button
              onClick={onOpenRefHelper}
              className={`slide-btn ${helperInfo.purpose === 'Medical' ? 'slide-btn-teal' : 'slide-btn-orange'} flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-full cursor-pointer`}
            >
              {helperInfo.purpose !== 'Business' && <ClipboardList className="w-3.5 h-3.5 relative z-10" />}
              <span className="relative z-10">{helperInfo.label}</span>
            </button>
          )}
          <button 
            onClick={handleCopyAll}
            className="slide-btn slide-btn-purple flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-full cursor-pointer shadow-xs"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-300 relative z-10 font-black animate-scaleIn" />
            ) : (
              <Copy className="w-3.5 h-3.5 relative z-10" />
            )}
            <span className="relative z-10">{isCopied ? "Copied!" : "Copy All"}</span>
          </button>
          <button 
            onClick={handleDownloadText}
            className="slide-btn slide-btn-slate flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">TXT</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="slide-btn slide-btn-orange flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-full cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">PDF</span>
          </button>
          <button 
            onClick={handleDownloadJSON}
            className="slide-btn slide-btn-blue flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full cursor-pointer"
          >
            <Braces className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 gap-y-1">
        {/* Row 1: Email & Mobile */}
        <DataField label="EMAIL" value={getGeneratedEmail(data)} highlight onValueChange={(val) => updateDataField('email', val)} />
        <DataField label="Mobile Number" value={data.mobileNumber ? data.mobileNumber.replace(/^\+88\s*/, '') : ''} confidence={data.fieldConfidence?.mobileNumber} onValueChange={(val) => updateDataField('mobileNumber', val)} />
        
        {/* Row 2: DOB & Gender */}
        <DataField label="DOB" value={data.dob} confidence={data.fieldConfidence?.dob} onValueChange={(val) => updateDataField('dob', val)} />
        <DataField label="Gender" value={data.gender || ''} confidence={data.fieldConfidence?.gender} onValueChange={(val) => updateDataField('gender', val)} />
        
        {/* Row 3: Surname & Given Name */}
        <DataField label="Surname" value={data.surname} confidence={data.fieldConfidence?.surname} onValueChange={(val) => updateDataField('surname', val)} />
        <DataField label="Given Name" value={data.givenName} confidence={data.fieldConfidence?.givenName} onValueChange={(val) => updateDataField('givenName', val)} />
        
        {/* Row 4: Passport Number & Place of Issue */}
        <DataField label="Passport Number" value={data.passportNumber} highlight confidence={data.fieldConfidence?.passportNumber} onValueChange={(val) => updateDataField('passportNumber', val)} />
        <DataField label="Place of Issue" value={data.placeOfIssue || "DHAKA"} onValueChange={(val) => updateDataField('placeOfIssue', val)} />
        
        {/* Row 5: Dates */}
        <DataField label="Date of Issue" value={data.issueDate} confidence={data.fieldConfidence?.issueDate} onValueChange={(val) => updateDataField('issueDate', val)} />
        <DataField label="Date of Expiry" value={data.expiryDate} warning={isExpiryWarning} confidence={data.fieldConfidence?.expiryDate} onValueChange={(val) => updateDataField('expiryDate', val)} />

        {/* Row 6: Birth Place & NID */}
        <DataField label="Town/City of birth/BIRTH PLACE" value={data.birthPlace} confidence={data.fieldConfidence?.birthPlace} onValueChange={(val) => updateDataField('birthPlace', val)} />
        <DataField label="National Id No/BIRTH CERTIFICATE NO" value={data.nidOrBirthCertNumber} confidence={data.fieldConfidence?.nidOrBirthCertNumber} onValueChange={(val) => updateDataField('nidOrBirthCertNumber', val)} />
        
        {/* Row 7: District & Spouse */}
        <DataField label="District of Birth" value={data.birthPlaceDistrict || data.birthPlace || ''} onValueChange={(val) => updateDataField('birthPlaceDistrict', val)} />
        <DataField label="Spouse's Name" value={data.spouseName || "N/A"} confidence={data.fieldConfidence?.spouseName} onValueChange={(val) => updateDataField('spouseName', val)} />

        {/* Row 8: Parents */}
        <DataField label="Father's Name" value={data.fatherName} confidence={data.fieldConfidence?.fatherName} onValueChange={(val) => updateDataField('fatherName', val)} />
        <DataField label="Mother's Name" value={data.motherName} confidence={data.fieldConfidence?.motherName} onValueChange={(val) => updateDataField('motherName', val)} />

        {/* Row 9: Addresses side-by-side in 2 columns */}
        <DataField 
          label="Present Address" 
          value={data.presentAddress || ''} 
          onValueChange={(val) => updateDataField('presentAddress', val)} 
        />
        <DataField 
          label="Permanent Address (From Passport)" 
          value={data.permanentAddress || ''} 
          confidence={data.fieldConfidence?.permanentAddress}
          onValueChange={(val) => updateDataField('permanentAddress', val)} 
        />

        {data.hospitalName && (
          <>
            <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50 mt-1">
              <h4 className="text-[11px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Medical / Hospital Details
              </h4>
            </div>
            
            <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-pink-500/5 dark:from-rose-950/30 dark:via-rose-950/20 dark:to-pink-950/10 p-3 rounded-xl border border-rose-500/30 dark:border-rose-500/40 shadow-xs space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg shadow-xs z-10 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                MEDICAL
              </div>
              <h5 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 border-b border-rose-200/50 dark:border-zinc-800 pb-1 mb-1 flex items-center gap-1 pr-16">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Hospital Details in India
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
            <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50 mt-1">
              <h4 className="text-[11px] font-bold text-amber-650 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Indian Reference ({utPurpose === 'Business' ? 'Kolkata Business' : utPurpose === 'Double Entry' ? 'Delhi Hotel' : 'Kolkata Hotel'} Details)
              </h4>
            </div>
            
            <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/5 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-orange-950/10 p-3 rounded-xl border border-amber-500/40 dark:border-amber-500/50 shadow-xs space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg shadow-xs z-10 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                {utPurpose === 'Business' ? 'BUSINESS' : utPurpose === 'Double Entry' ? 'DELHI HOTEL' : 'KOLKATA HOTEL'}
              </div>

              <h5 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 border-b border-amber-200/50 dark:border-zinc-800 pb-1 mb-1 flex items-center gap-1 pr-16">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                {utPurpose === 'Business' ? 'Kolkata Business Details' : `${utPurpose === 'Double Entry' ? 'Delhi' : 'Kolkata'} Hotel Details`} (Reference in India)
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
