import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Copy, Printer, RotateCcw, Check, Download, FileText, FileSpreadsheet, Edit3 } from 'lucide-react';
import { PassportData } from '../types';
import { getGeneratedEmail, getProprietorBusinessName, getJobCompanyName, getJobRole } from '../utils/addressUtils';

interface CoverLetterTabProps {
  data: PassportData;
  utPurpose?: string;
  updateDataField: (field: keyof PassportData, value: string) => void;
}

type VisaCategory = 'Tourism' | 'Business' | 'Medical - Patient' | 'Medical - Attendant' | 'Double Entry';

export function CoverLetterTab({ data, utPurpose, updateDataField }: CoverLetterTabProps) {
  // 1. Manage state for all editable parameters
  const [candidateName, setCandidateName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [dob, setDob] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState('01-01-2022');
  const [letterDate, setLetterDate] = useState('');
  const [category, setCategory] = useState<VisaCategory>('Tourism');
  
  // Additional medical attendant fields
  const [patientName, setPatientName] = useState('Mohammad Rahman');
  const [patientPassport, setPatientPassport] = useState('A01234567');
  
  // Custom travel itinerary fields
  const [travelFrom, setTravelFrom] = useState('25-10-2026');
  const [travelTo, setTravelTo] = useState('10-11-2026');
  const [indianReference, setIndianReference] = useState('');
  
  // Custom letterhead title & body text state
  const [letterBody, setLetterBody] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDirectEditing, setIsDirectEditing] = useState(false);

  // Synchronize initial data
  useEffect(() => {
    const name = `${data.givenName || ''} ${data.surname || ''}`.trim() || 'Mohammad Rahman';
    setCandidateName(name);
    setPassportNumber(data.passportNumber || 'E01234567');
    setDob(data.dob || '01-01-1990');
    
    // Auto-detect company and designation based on business type
    const comp = getJobCompanyName(data) || getProprietorBusinessName(data) || 'Alpha Trading Ltd.';
    const desig = getJobRole(data) || 'Proprietor';
    setCompanyName(comp);
    setDesignation(desig);
    
    // Auto-detect Indian reference address
    const refName = data.hotelName || data.hospitalName || 'The Peerless Inn Kolkata';
    const refAddress = data.hotelAddress || data.hospitalAddress || '12, Jawaharlal Nehru Rd, Esplanade, Kolkata';
    setIndianReference(`${refName}, ${refAddress}`);

    // Set default travel dates
    setTravelFrom('25-10-2026');
    setTravelTo('10-11-2026');

    // Default current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    setLetterDate(formattedDate);

    // Auto-set category based on utPurpose
    if (utPurpose) {
      if (utPurpose === 'Tourism') setCategory('Tourism');
      else if (utPurpose === 'Business') setCategory('Business');
      else if (utPurpose === 'Medical Treatment - Patient') setCategory('Medical - Patient');
      else if (utPurpose === 'Medical Treatment - Attendance') setCategory('Medical - Attendant');
      else if (utPurpose === 'Double Entry') setCategory('Double Entry');
    }
  }, [data, utPurpose]);

  // Generate standard templates
  const getTemplate = (cat: VisaCategory) => {
    const toAddress = `To,
The Visa Officer,
High Commission of India,
Dhaka, Bangladesh.`;

    let subject = '';
    let body = '';

    if (cat === 'Tourism') {
      subject = 'Subject: Application for Indian Tourist (T) Visa.';
      body = `Dear Sir/Madam,

I am writing to formally submit my application for an Indian Tourist Visa. I am planning a leisure trip to India to experience its vibrant cultural heritage, historic landmarks, and scenery. My personal details are highlighted below:

- Full Name: ${candidateName}
- Passport Number: ${passportNumber}
- Date of Birth: ${dob}

I currently hold the position of ${designation} at ${companyName}, where I have been employed since ${joiningDate}. I have secured vacation approval from my company for this trip.

My travel is scheduled from ${travelFrom} to ${travelTo}. During my stay, I will be residing at ${indianReference}.

I declare that all expenses related to my transport, accommodation, and personal requirements in India will be fully self-funded. I promise to comply with all visa regulations and return to Bangladesh immediately upon completing my travel.

I kindly request you to grant me an Indian Tourist Visa. Thank you for your time and kind consideration of my application.

Sincerely yours,

____________________
${candidateName}
Designation: ${designation}
Company: ${companyName}`;
    } else if (cat === 'Business') {
      subject = 'Subject: Application for Indian Business (B) Visa.';
      body = `Dear Sir/Madam,

I am writing to request an Indian Business Visa. The purpose of my visit is to attend trade discussions, explore new supply chain connections, and meet with commercial partners in India. My personal and professional details are as follows:

- Candidate Name: ${candidateName}
- Passport Number: ${passportNumber}
- Date of Birth: ${dob}
- Designation: ${designation}
- Sponsoring Company: ${companyName}

I have been serving as the ${designation} at ${companyName} since ${joiningDate}. Our company is actively expanding trade interests with suppliers in India, necessitating my physical presence for corporate consultations.

My journey is planned from ${travelFrom} to ${travelTo}, and my business contact reference in India will be: ${indianReference}.

All expenses related to my travel, accommodation, and stay in India will be sponsored by ${companyName}. I assure you that I will strictly abide by all local regulations and return to Bangladesh to continue my business operations as scheduled.

I request you to kindly grant me a Business Visa. Thank you for your consideration.

Sincerely yours,

____________________
${candidateName}
${designation}, ${companyName}`;
    } else if (cat === 'Medical - Patient') {
      subject = 'Subject: Application for Indian Medical (MED) Visa for Treatment.';
      body = `Dear Sir/Madam,

I am writing to formally request an Indian Medical Visa to receive essential medical care and specialized treatment in India. My details are listed below:

- Patient Name: ${candidateName}
- Passport Number: ${passportNumber}
- Date of Birth: ${dob}

I have been diagnosed with a clinical condition that requires advanced consultation and professional medical treatment. For this purpose, I have scheduled an appointment at ${data.hospitalName || 'Apollo Gleneagles Hospitals'}, located at ${data.hospitalAddress || 'Kolkata, India'}.

I am planning to travel on ${travelFrom} to initiate the clinical protocol and expect to complete the treatment course by ${travelTo}.

I guarantee that all medical and travel-related expenses will be borne entirely by myself/my family. I kindly request you to issue a Medical Visa to allow me to proceed with my treatment. Thank you.

Sincerely yours,

____________________
${candidateName}
Passport No: ${passportNumber}`;
    } else if (cat === 'Medical - Attendant') {
      subject = 'Subject: Application for Indian Medical Attendant (MEDX) Visa.';
      body = `Dear Sir/Madam,

I am writing to request an Indian Medical Attendant Visa to accompany and care for my patient, ${patientName}, who is traveling to India for specialized medical care. My details are as follows:

- Attendant Name: ${candidateName}
- Passport Number: ${passportNumber}
- Date of Birth: ${dob}

My patient's details are:
- Patient Name: ${patientName}
- Patient Passport Number: ${patientPassport}

The patient requires continuous physical assistance and logistical support during their medical journey and treatment at ${data.hospitalName || 'Apollo Gleneagles Hospitals'}, located at ${data.hospitalAddress || 'Kolkata, India'}. I will be traveling with the patient from ${travelFrom} to ${travelTo} to act as their primary caregiver.

I assure you that all expenses related to my stay and travel in India will be fully covered. I kindly ask you to grant me a Medical Attendant Visa. Thank you.

Sincerely yours,

____________________
${candidateName}
Passport No: ${passportNumber}`;
    } else if (cat === 'Double Entry') {
      subject = 'Subject: Request for Double Entry Tourist Visa.';
      body = `Dear Sir/Madam,

I am writing to formally request a Double Entry Tourist Visa for my upcoming travel itinerary. My details are highlighted below:

- Full Name: ${candidateName}
- Passport Number: ${passportNumber}
- Date of Birth: ${dob}

Currently, I am working as ${designation} at ${companyName} (employed since ${joiningDate}). I am scheduling a regional tour which requires a double-entry facility into India, allowing me to transition to neighboring countries and subsequently re-enter India for my transit back to Bangladesh.

My complete itinerary spans from ${travelFrom} to ${travelTo}. During my stay, my hotel accommodation will be: ${indianReference}.

I declare that all expenses related to this multi-city travel will be fully self-funded. I request you to kindly issue me a Double Entry Visa for my smooth transit. Thank you.

Sincerely yours,

____________________
${candidateName}
Designation: ${designation}
Company: ${companyName}`;
    }

    return `${toAddress}\n\nDate: ${letterDate}\n\n${subject}\n\n${body}`;
  };

  // Automatically update letter body when fields change (unless directly editing the body)
  useEffect(() => {
    if (!isDirectEditing) {
      setLetterBody(getTemplate(category));
    }
  }, [candidateName, passportNumber, dob, companyName, designation, joiningDate, letterDate, category, patientName, patientPassport, travelFrom, travelTo, indianReference, isDirectEditing]);

  const handleReset = () => {
    setIsDirectEditing(false);
    setLetterBody(getTemplate(category));
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(letterBody);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cover Letter - ${candidateName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1a1a1a;
              line-height: 1.6;
              padding: 25mm 20mm;
              margin: 0;
              font-size: 14px;
              background: #fff;
            }
            .letter-content {
              white-space: pre-wrap;
              max-width: 100%;
              word-wrap: break-word;
            }
            @media print {
              body {
                padding: 15mm 15mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="letter-content">${letterBody}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Dynamic cover letter action and editor panel */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Side: Field Controls */}
        <div className="w-full xl:w-2/5 space-y-4">
          <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 mb-3 uppercase tracking-wider">
              Cover Letter Parameters
            </h3>
            
            {/* Template Selector */}
            <div className="mb-4">
              <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-1">
                Visa Category (Template Format)
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as VisaCategory);
                  setIsDirectEditing(false); // Reset to new template
                }}
                className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Tourism">Tourist Visa (Tourism)</option>
                <option value="Business">Business Visa (Corporate)</option>
                <option value="Medical - Patient">Medical Visa (Patient)</option>
                <option value="Medical - Attendant">Medical Attendant Visa (Attendant)</option>
                <option value="Double Entry">Double Entry Visa (DNT)</option>
              </select>
            </div>

            <div className="space-y-3.5">
              {/* Dynamic Inputs based on selection */}
              <div>
                <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                  Applicant Name
                </label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                  placeholder="Applicant Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                    placeholder="Passport No"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                    placeholder="DD-MM-YYYY"
                  />
                </div>
              </div>

              {category !== 'Medical - Patient' && category !== 'Medical - Attendant' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                      placeholder="Designation"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                      Joining Date
                    </label>
                    <input
                      type="text"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                      placeholder="DD-MM-YYYY"
                    />
                  </div>
                </div>
              )}

              {category === 'Medical - Attendant' && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/20">
                  <h4 className="col-span-2 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">Patient Information</h4>
                  <div>
                    <label className="text-[9px] font-mono text-rose-500 uppercase block mb-0.5">Patient Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-rose-500 uppercase block mb-0.5">Patient Passport</label>
                    <input
                      type="text"
                      value={patientPassport}
                      onChange={(e) => setPatientPassport(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                    Travel From Date
                  </label>
                  <input
                    type="text"
                    value={travelFrom}
                    onChange={(e) => setTravelFrom(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                    placeholder="DD-MM-YYYY"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                    Travel To Date
                  </label>
                  <input
                    type="text"
                    value={travelTo}
                    onChange={(e) => setTravelTo(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                    placeholder="DD-MM-YYYY"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                  India Reference / Accommodation
                </label>
                <input
                  type="text"
                  value={indianReference}
                  onChange={(e) => setIndianReference(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                  placeholder="Hotel/Reference details"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6B7076] dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                  Letter Date
                </label>
                <input
                  type="text"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100"
                  placeholder="Current Date"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: A4 Live Paper Preview & Direct Editing */}
        <div className="w-full xl:w-3/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded uppercase tracking-wider">
                A4 Live Draft
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                (Click content to edit directly)
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 transition-all"
                title="Reset to original template"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg transition-all"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-lg transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Cover Letter</span>
              </button>
            </div>
          </div>

          {/* Letterhead Design Paper */}
          <div className="border border-slate-200 dark:border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden bg-white text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
            {/* Top decorative header rail */}
            <div className="h-2 bg-[#0C8493]"></div>

            <div className="p-6 md:p-8 space-y-4">
              {/* Direct Editing Cover Letter Content Textarea */}
              <textarea
                value={letterBody}
                onChange={(e) => {
                  setIsDirectEditing(true);
                  setLetterBody(e.target.value);
                }}
                className="w-full h-[480px] text-[13px] leading-relaxed border-none focus:outline-none focus:ring-0 bg-transparent text-slate-800 dark:text-zinc-200 font-sans resize-none scrollbar-thin"
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: "'Inter', sans-serif"
                }}
              />
            </div>
            
            {/* Bottom decorative rail */}
            <div className="h-1 bg-[#FF8006]"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
