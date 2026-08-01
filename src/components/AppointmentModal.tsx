import React, { useState, useEffect } from 'react';
import { 
  X, Copy, Check, Download, Calendar, User, Phone, Mail, MapPin, Briefcase, FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { PassportData } from '../types';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PassportData;
  utDoctorName?: string; // department
}

export function AppointmentModal({
  isOpen,
  onClose,
  data,
  utDoctorName = ''
}: AppointmentModalProps) {
  useLockBodyScroll(isOpen);

  // States for editable fields inside the modal
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
  }, [data, utDoctorName, isOpen]);

  if (!isOpen) return null;

  // Generate the formatted plain text for copy
  const getFormattedText = () => {
    return `Patient Details:

* Name: ${name}
* DOB: ${dob}
* Passport: ${passport}
* Address: ${address}
* Department: ${department}
* Phone: ${phone}
* Email: ${email}`;
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
            display: inline-block;
            width: 120px;
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
            <li><span class="label">* Name:</span><span class="value">${name}</span></li>
            <li><span class="label">* DOB:</span><span class="value">${dob}</span></li>
            <li><span class="label">* Passport:</span><span class="value">${passport}</span></li>
            <li><span class="label">* Address:</span><span class="value">${address}</span></li>
            <li><span class="label">* Department:</span><span class="value">${department}</span></li>
            <li><span class="label">* Phone:</span><span class="value">${phone}</span></li>
            <li><span class="label">* Email:</span><span class="value">${email}</span></li>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 z-10 flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4 mb-4">
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
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1.5 scrollbar-thin">
          {/* Editable Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
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
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
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
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
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
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
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
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
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
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
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
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
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

          {/* Formatted Preview Box */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Preview (Plain Text)
            </span>
            <pre className="w-full p-4 rounded-xl bg-slate-900 dark:bg-zinc-950 text-slate-100 font-mono text-xs overflow-x-auto border-2 border-zinc-950 shadow-inner select-all leading-relaxed whitespace-pre-wrap">
              {getFormattedText()}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-2 border-t border-slate-100 dark:border-zinc-800/80 pt-4 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 slide-btn slide-btn-purple py-2.5 px-4 text-xs sm:text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm relative overflow-hidden"
          >
            {isCopied ? (
              <>
                <Check className="w-4.5 h-4.5 text-emerald-300 relative z-10 animate-scaleIn" />
                <span className="relative z-10">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4.5 h-4.5 relative z-10" />
                <span className="relative z-10">Copy Formatted Text</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDownloadDoc}
            className="flex-1 slide-btn slide-btn-orange py-2.5 px-4 text-xs sm:text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm relative overflow-hidden"
          >
            <Download className="w-4.5 h-4.5 relative z-10" />
            <span className="relative z-10">Download Word File (.doc)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
