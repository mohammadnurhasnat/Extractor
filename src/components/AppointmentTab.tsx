import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, Download, Calendar, User, Phone, Mail, MapPin, Briefcase, FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { PassportData } from '../types';

interface AppointmentTabProps {
  data: PassportData;
  utDoctorName?: string;
}

export function AppointmentTab({
  data,
  utDoctorName = ''
}: AppointmentTabProps) {
  // States for editable fields
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [passport, setPassport] = useState('');
  const [address, setAddress] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('hasnatmdnur@gmail.com');

  const [isCopied, setIsCopied] = useState(false);

  // Initialize fields from data
  useEffect(() => {
    if (data) {
      const fullName = `${data.givenName || ''} ${data.surname || ''}`.trim();
      setName(fullName);
      setDob(data.dob || '');
      setPassport(data.passportNumber || '');
      setAddress(data.permanentAddress || data.presentAddress || '');
      setDepartment(utDoctorName || data.jobRole || '');
      setPhone(data.mobileNumber ? data.mobileNumber.replace(/^\+88\s*/, '') : '');
      setEmail('hasnatmdnur@gmail.com');
    }
  }, [data, utDoctorName]);

  // Generate the formatted plain text for copy (with double space after colon)
  const getFormattedText = () => {
    return `Patient Details:

* Name:  ${name}
* DOB:  ${dob}
* Passport:  ${passport}
* Address:  ${address}
* Department:  ${department}
* Phone:  ${phone}
* Email:  ${email}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFormattedText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownloadDoc = () => {
    const formattedDate = new Date().toLocaleDateString();
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Patient Appointment Details</title>
        <style>
          body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1e293b;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 30px;
            background-color: #ffffff;
            border-radius: 8px;
          }
          h2 {
            font-size: 16pt;
            color: #0f172a;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 8px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .meta-info {
            font-size: 9pt;
            color: #64748b;
            margin-bottom: 20px;
            text-align: right;
          }
          ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
          }
          li {
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px dashed #f1f5f9;
            font-size: 11pt;
          }
          .label {
            font-weight: bold;
            color: #0284c7;
            margin-right: 8px;
          }
          .value {
            color: #334155;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Patient Details:</h2>
          <div class="meta-info">Generated on: ${formattedDate}</div>
          <ul>
            <li><span class="label">* Name:&nbsp;&nbsp;</span><span class="value">${name}</span></li>
            <li><span class="label">* DOB:&nbsp;&nbsp;</span><span class="value">${dob}</span></li>
            <li><span class="label">* Passport:&nbsp;&nbsp;</span><span class="value">${passport}</span></li>
            <li><span class="label">* Address:&nbsp;&nbsp;</span><span class="value">${address}</span></li>
            <li><span class="label">* Department:&nbsp;&nbsp;</span><span class="value">${department}</span></li>
            <li><span class="label">* Phone:&nbsp;&nbsp;</span><span class="value">${phone}</span></li>
            <li><span class="label">* Email:&nbsp;&nbsp;</span><span class="value">${email}</span></li>
          </ul>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = name.trim().replace(/\s+/g, '_');
    a.download = `Appointment-${cleanName || 'Patient'}-${passport || 'Unknown'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 p-1"
    >
      {/* Tab Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-zinc-100">
              Patient Appointment Details
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Verify or edit the patient information before copying or downloading.
            </p>
          </div>
        </div>
      </div>

      {/* Editable Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/60 shadow-xs">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3 text-blue-500" /> Patient Name
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-500" /> Date of Birth
          </label>
          <input 
            type="text" 
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3 text-teal-500" /> Passport Number
          </label>
          <input 
            type="text" 
            value={passport}
            onChange={(e) => setPassport(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-purple-500" /> Department
          </label>
          <input 
            type="text" 
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Cardiology"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Phone className="w-3 h-3 text-emerald-500" /> Mobile Number
          </label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Mail className="w-3 h-3 text-amber-500" /> Email Address
          </label>
          <input 
            type="text" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-1 sm:col-span-2 space-y-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-500" /> Permanent Address
          </label>
          <textarea 
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
        <button
          onClick={handleCopy}
          className="w-full sm:w-auto slide-btn slide-btn-purple py-2 px-5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm relative overflow-hidden"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300 relative z-10 animate-scaleIn" />
              <span className="relative z-10">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Copy Text</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleDownloadDoc}
          className="w-full sm:w-auto slide-btn slide-btn-orange py-2 px-5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm relative overflow-hidden"
        >
          <Download className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Word File(.doc)</span>
        </button>
      </div>
    </motion.div>
  );
}
