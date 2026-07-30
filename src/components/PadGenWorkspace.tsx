import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, ArrowLeft, Printer, Download, CreditCard, Award, 
  UserSquare2, Stamp, LogOut, Check, ChevronRight, LayoutGrid, 
  Heading, MapPin, Phone, Mail, Globe, Image as ImageIcon, Sparkles, 
  RefreshCw, CheckCircle2, User, Building, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PadGenWorkspaceProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    mobileNumber?: string;
  } | null;
  onLogout: () => void;
}

export function PadGenWorkspace({ currentUser, onLogout }: PadGenWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'pad' | 'card' | 'noc' | 'idcard' | 'cover' | 'seal'>('pad');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 1. Pad State
  const [padCompany, setPadCompany] = useState('Global Trade & Technology');
  const [padSlogan, setPadSlogan] = useState('Empowering Digital Transformations');
  const [padAddress, setPadAddress] = useState('Suite 402, Level 4, Green Road, Dhaka 1215');
  const [padPhone, setPadPhone] = useState('+880 1712-345678');
  const [padEmail, setPadEmail] = useState('info@globaltrade.com');
  const [padWeb, setPadWeb] = useState('www.globaltrade.com');
  const [padColor, setPadColor] = useState('#2563eb'); // primary color
  const [padTemplate, setPadTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern');
  const [padBody, setPadBody] = useState(`তারিখ: ৩০ জুলাই, ২০২৬

বরাবর,
যথাযোগ্য কর্তৃপক্ষ

বিষয়: অনাপত্তি ও সহযোগিতা সংক্রান্ত আবেদনপত্র।

মহোদয়,
বিনীত নিবেদন এই যে, আমাদের প্রতিষ্ঠানের একজন সম্মানিত গ্রাহক/কর্মকর্তা ওনার পাসপোর্টের ডাটা যাচাই ও পরবর্তী প্রয়োজনীয় প্রক্রিয়াকরণের জন্য আবেদন করেছেন। উক্ত আবেদনের প্রেক্ষিতে ওনার ডাটা সঠিক ও নির্ভুলভাবে বিশ্লেষণ করা হয়েছে।

আমাদের পক্ষ থেকে ওনার এই কার্যক্রমের উপর কোনো প্রকার দ্বিমত বা আপত্তি নেই। ওনার পরবর্তী সকল দাপ্তরিক প্রক্রিয়ায় যথাযথ সহযোগিতা প্রদানের জন্য বিনীত অনুরোধ করা হলো।

ধন্যবাদান্তে,
পরিচালক,
গ্লোবাল ট্রেড অ্যান্ড টেকনোলজি`);

  // 2. Visiting Card State
  const [cardName, setCardName] = useState(currentUser?.name || 'Mohammad Nur Hasnat');
  const [cardDesignation, setCardDesignation] = useState('Managing Director');
  const [cardCompany, setCardCompany] = useState('Global Trade & Technology');
  const [cardPhone, setCardPhone] = useState('+880 1712-345678');
  const [cardEmail, setCardEmail] = useState(currentUser?.email || 'md@globaltrade.com');
  const [cardWeb, setCardWeb] = useState('www.globaltrade.com');
  const [cardAddress, setCardAddress] = useState('Green Road, Dhaka, Bangladesh');
  const [cardColor, setCardColor] = useState('#0f172a');
  const [cardTheme, setCardTheme] = useState<'luxury' | 'corporate' | 'creative'>('luxury');

  // 3. NOC State
  const [nocRef, setNocRef] = useState('GTT-NOC-2026-089');
  const [nocDate, setNocDate] = useState('30 July 2026');
  const [nocEmpName, setNocEmpName] = useState('Mohammad Nur Hasnat');
  const [nocPassport, setNocPassport] = useState('A12345678');
  const [nocDesg, setNocDesg] = useState('Senior IT Consultant');
  const [nocSalary, setNocSalary] = useState('85,000 BDT');
  const [nocJoinDate, setNocJoinDate] = useState('12 January 2021');
  const [nocPurpose, setNocPurpose] = useState('Tourism & International Business Meeting');
  const [nocDestination, setNocDestination] = useState('India & Singapore');

  // 4. Office ID Card State
  const [idName, setIdName] = useState(currentUser?.name || 'Mohammad Nur Hasnat');
  const [idEmpId, setIdEmpId] = useState('EMP-2026-904');
  const [idDept, setIdDept] = useState('Technology & Development');
  const [idBlood, setIdBlood] = useState('O+');
  const [idJoined, setIdJoined] = useState('2021');
  const [idPhone, setIdPhone] = useState('+880 1712-345678');
  const [idColor, setIdColor] = useState('#3b82f6');

  // 5. Cover Letter State
  const [covRecipient, setCovRecipient] = useState('The HR Manager');
  const [covCompany, setCovCompany] = useState('Leading Tech Ltd');
  const [covAddress, setCovAddress] = useState('Gulshan-2, Dhaka 1212');
  const [covSubject, setCovSubject] = useState('Application for Senior Full-Stack Developer position');
  const [covSalutation, setCovSalutation] = useState('Dear Hiring Team,');
  const [covBody, setCovBody] = useState(`I am writing to express my strong interest in the Senior Full-Stack Developer position at your esteemed company. With over 5 years of production experience building scalable React and Node.js systems, I am confident in my ability to make an immediate impact.

In my previous roles, I have successfully designed, built, and optimized real-time web applications, reducing server response latencies and scaling database architectures to support thousands of active users. My focus has always been on creating visually delightful, performance-optimized, and secure software.

I look forward to the possibility of discussing how my experience can align with your development goals. Thank you for your time and consideration.`);

  // 6. Seal State
  const [sealOuterText, setSealOuterText] = useState('GLOBAL TRADE & TECHNOLOGY *');
  const [sealInnerText, setSealInnerText] = useState('APPROVED');
  const [sealColor, setSealColor] = useState('#dc2626'); // Red seal default

  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    setToast({ message: 'পিডিএফ তৈরি হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।', type: 'success' });
    
    try {
      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: activeTab === 'card' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: activeTab === 'card' ? [90, 50] : 'a4'
      });
      
      if (activeTab === 'card') {
        pdf.addImage(imgData, 'PNG', 0, 0, 90, 50);
      } else if (activeTab === 'seal') {
        pdf.addImage(imgData, 'PNG', 45, 45, 120, 120);
      } else {
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      pdf.save(`PadGen_${activeTab}_${Date.now()}.pdf`);
      setToast({ message: 'পিডিএফ ফাইলটি সফলভাবে ডাউনলোড হয়েছে!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'পিডিএফ তৈরি করতে ব্যর্থ হয়েছে।', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] dark:bg-zinc-950 font-sans text-slate-800 dark:text-zinc-100 selection:bg-amber-100 dark:selection:bg-amber-900/30">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-semibold tracking-wide ${
              toast.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400' 
                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="border-b border-amber-900/10 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <a 
              href="https://extractor.fun/" 
              target="_self"
              className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
              title="Extractor-এ ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">PadGen</span>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">Subdomain SSO</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Professional Pad & Corporate Document Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{currentUser.email}</span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>

        </div>
      </header>

      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-br from-amber-500/5 via-indigo-500/5 to-purple-500/5 py-8 px-4 border-b border-amber-900/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Approved SSO Session
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
              প্রফেশনাল প্যাড ও কর্পোরেট ডকুমেন্ট মেকার
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              আপনার পাসপোর্টের তথ্য এক্সট্রাক্ট করার পর, এই সাবডোমেন থেকে সরাসরি প্রফেশনাল প্যাড, NOC, ভিজিটিং কার্ড এবং সিল ডিজাইন ও প্রিন্ট করতে পারবেন। সম্পূর্ণ ডাটা সিঙ্কড।
            </p>
          </div>
          <div className="shrink-0">
            <a
              href="https://extractor.fun/"
              target="_self"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-extrabold text-xs shadow-md shadow-slate-900/10 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Landmark className="w-4 h-4" />
              <span>Extractor-এ ফিরে যান</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Controls (Forms) - lg:span-5 */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick Navigation Tabs */}
            <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-amber-900/5 dark:border-zinc-800 shadow-sm flex flex-wrap gap-1">
              {[
                { id: 'pad', label: 'প্যাড (A4)', icon: FileText },
                { id: 'card', label: 'ভিজিটিং কার্ড', icon: CreditCard },
                { id: 'noc', label: 'NOC পত্র', icon: Award },
                { id: 'idcard', label: 'অফিস আইডি', icon: UserSquare2 },
                { id: 'cover', label: 'কভার লেটার', icon: FileText },
                { id: 'seal', label: 'অফিস সিল', icon: Stamp },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-1 min-w-[120px] justify-center cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input fields based on active tab */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-amber-900/5 dark:border-zinc-800 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-500" />
                <span>তথ্য ও এডিট প্যানেল (Data Editor)</span>
              </h3>

              {activeTab === 'pad' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">কোম্পানির নাম (Company Name)</label>
                    <input 
                      type="text" 
                      value={padCompany} 
                      onChange={(e) => setPadCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">স্লোগান/ট্যাগলাইন (Slogan/Tagline)</label>
                    <input 
                      type="text" 
                      value={padSlogan} 
                      onChange={(e) => setPadSlogan(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">মোবাইল (Mobile)</label>
                      <input 
                        type="text" 
                        value={padPhone} 
                        onChange={(e) => setPadPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ইমেইল (Email)</label>
                      <input 
                        type="text" 
                        value={padEmail} 
                        onChange={(e) => setPadEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ওয়েবসাইট (Website)</label>
                      <input 
                        type="text" 
                        value={padWeb} 
                        onChange={(e) => setPadWeb(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">রঙ নির্বাচন (Accent Color)</label>
                      <div className="flex gap-1.5 mt-1">
                        {['#2563eb', '#16a34a', '#dc2626', '#4f46e5', '#0f172a'].map((c) => (
                          <button 
                            key={c}
                            onClick={() => setPadColor(c)}
                            className={`w-6 h-6 rounded-full border border-white dark:border-zinc-950 shadow-sm transition-transform active:scale-90 ${padColor === c ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-zinc-200' : ''}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">পূর্ণ ঠিকানা (Full Address)</label>
                    <input 
                      type="text" 
                      value={padAddress} 
                      onChange={(e) => setPadAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">প্যাডের বিষয়বস্তু (Letterhead Body Content)</label>
                    <textarea 
                      rows={5}
                      value={padBody} 
                      onChange={(e) => setPadBody(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'card' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">কার্ডের নাম (Name on Card)</label>
                    <input 
                      type="text" 
                      value={cardName} 
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">পদবী (Designation)</label>
                    <input 
                      type="text" 
                      value={cardDesignation} 
                      onChange={(e) => setCardDesignation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">কোম্পানির নাম (Company Name)</label>
                    <input 
                      type="text" 
                      value={cardCompany} 
                      onChange={(e) => setCardCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">মোবাইল (Phone)</label>
                      <input 
                        type="text" 
                        value={cardPhone} 
                        onChange={(e) => setCardPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ইমেইল (Email)</label>
                      <input 
                        type="text" 
                        value={cardEmail} 
                        onChange={(e) => setCardEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ওয়েবসাইট (Website)</label>
                      <input 
                        type="text" 
                        value={cardWeb} 
                        onChange={(e) => setCardWeb(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">কার্ড থিম (Card Color Theme)</label>
                      <select 
                        value={cardColor} 
                        onChange={(e) => setCardColor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      >
                        <option value="#0f172a">Premium Dark Slate</option>
                        <option value="#1e3a8a">Corporate Royal Blue</option>
                        <option value="#14532d">Executive Dark Green</option>
                        <option value="#701a75">Creative Deep Purple</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">ঠিকানা (Address Line)</label>
                    <input 
                      type="text" 
                      value={cardAddress} 
                      onChange={(e) => setCardAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'noc' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">স্মারক নাম্বার (Ref Number)</label>
                      <input 
                        type="text" 
                        value={nocRef} 
                        onChange={(e) => setNocRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">তারিখ (Date)</label>
                      <input 
                        type="text" 
                        value={nocDate} 
                        onChange={(e) => setNocDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">কর্মকর্তার নাম (Employee Name)</label>
                      <input 
                        type="text" 
                        value={nocEmpName} 
                        onChange={(e) => setNocEmpName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">পাসপোর্ট নং (Passport Number)</label>
                      <input 
                        type="text" 
                        value={nocPassport} 
                        onChange={(e) => setNocPassport(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 font-semibold uppercase"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">পদবী (Designation)</label>
                      <input 
                        type="text" 
                        value={nocDesg} 
                        onChange={(e) => setNocDesg(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">মাসিক বেতন (Monthly Salary)</label>
                      <input 
                        type="text" 
                        value={nocSalary} 
                        onChange={(e) => setNocSalary(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">যোগদানের তারিখ (Joining Date)</label>
                      <input 
                        type="text" 
                        value={nocJoinDate} 
                        onChange={(e) => setNocJoinDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ভ্রমণের উদ্দেশ্য (Purpose)</label>
                      <input 
                        type="text" 
                        value={nocPurpose} 
                        onChange={(e) => setNocPurpose(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">ভ্রমণের দেশসমূহ (Destination Countries)</label>
                    <input 
                      type="text" 
                      value={nocDestination} 
                      onChange={(e) => setNocDestination(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'idcard' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">আইডি নাম (Employee Name)</label>
                    <input 
                      type="text" 
                      value={idName} 
                      onChange={(e) => setIdName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">আইডি নম্বর (ID Number)</label>
                      <input 
                        type="text" 
                        value={idEmpId} 
                        onChange={(e) => setIdEmpId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">রক্তের গ্রুপ (Blood Group)</label>
                      <input 
                        type="text" 
                        value={idBlood} 
                        onChange={(e) => setIdBlood(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">বিভাগ (Department)</label>
                      <input 
                        type="text" 
                        value={idDept} 
                        onChange={(e) => setIdDept(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">যোগদানের বছর (Joined)</label>
                      <input 
                        type="text" 
                        value={idJoined} 
                        onChange={(e) => setIdJoined(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">মোবাইল (Emergency Phone)</label>
                      <input 
                        type="text" 
                        value={idPhone} 
                        onChange={(e) => setIdPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">আইডি কালার (ID Theme Color)</label>
                      <input 
                        type="color" 
                        value={idColor} 
                        onChange={(e) => setIdColor(e.target.value)}
                        className="w-full h-10 p-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cover' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">প্রাপক (Recipient)</label>
                      <input 
                        type="text" 
                        value={covRecipient} 
                        onChange={(e) => setCovRecipient(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">প্রাপক কোম্পানি (Recipient Company)</label>
                      <input 
                        type="text" 
                        value={covCompany} 
                        onChange={(e) => setCovCompany(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">প্রাপকের ঠিকানা (Recipient Address)</label>
                    <input 
                      type="text" 
                      value={covAddress} 
                      onChange={(e) => setCovAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">বিষয় (Subject)</label>
                    <input 
                      type="text" 
                      value={covSubject} 
                      onChange={(e) => setCovSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">সম্বোধন (Salutation)</label>
                    <input 
                      type="text" 
                      value={covSalutation} 
                      onChange={(e) => setCovSalutation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">কভার লেটার বডি (Cover Letter Body)</label>
                    <textarea 
                      rows={6}
                      value={covBody} 
                      onChange={(e) => setCovBody(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'seal' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">বাইরের গোলাকার লেখা (Outer Circular Text)</label>
                    <input 
                      type="text" 
                      value={sealOuterText} 
                      onChange={(e) => setSealOuterText(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 font-mono tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">ভেতরের সোজা লেখা (Inner Straight Text)</label>
                    <input 
                      type="text" 
                      value={sealInnerText} 
                      onChange={(e) => setSealInnerText(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-zinc-100 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">সিল কালার (Seal Ink Color)</label>
                    <div className="flex gap-1.5 mt-1">
                      {['#dc2626', '#16a34a', '#2563eb', '#4f46e5', '#0f172a'].map((c) => (
                        <button 
                          key={c}
                          onClick={() => setSealColor(c)}
                          className={`w-6 h-6 rounded-full border border-white dark:border-zinc-950 shadow-sm transition-transform active:scale-90 ${sealColor === c ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-zinc-200' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Panel */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-md shadow-indigo-600/15 hover:bg-indigo-700 hover:shadow-indigo-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>পিডিএফ ডাউনলোড</span>
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT: Live Interactive Preview Container - lg:span-7 */}
          <div className="lg:col-span-7 bg-slate-100 dark:bg-zinc-900/60 p-4 sm:p-8 rounded-3xl border border-amber-900/5 dark:border-zinc-800 shadow-inner flex justify-center items-center overflow-auto min-h-[500px]">
            
            <div 
              ref={previewRef}
              className="bg-white text-slate-800 p-4 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between print:shadow-none print:p-0 select-none border border-slate-200/60"
              style={{
                width: activeTab === 'card' ? '450px' : activeTab === 'seal' ? '360px' : '210mm',
                height: activeTab === 'card' ? '250px' : activeTab === 'seal' ? '360px' : '297mm',
                minHeight: activeTab === 'card' ? '250px' : activeTab === 'seal' ? '360px' : '297mm',
                borderRadius: activeTab === 'card' ? '16px' : activeTab === 'seal' ? '50%' : '0px',
                aspectRatio: activeTab === 'card' ? '9/5' : activeTab === 'seal' ? '1/1' : '1/1.414'
              }}
            >
              
              {/* WATERMARK WATER-DROP LOGO ON PAD */}
              {activeTab === 'pad' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none select-none z-0">
                  <Landmark className="w-80 h-80" style={{ color: padColor }} />
                </div>
              )}

              {/* TAB 1: PROFESSIONAL LETTERHEAD / PAD */}
              {activeTab === 'pad' && (
                <div className="flex flex-col justify-between h-full w-full relative z-10 font-sans">
                  {/* Pad Header */}
                  <div className="border-b-4 pb-4 flex items-start justify-between gap-4" style={{ borderColor: padColor }}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: padColor }}>
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: padColor }}>{padCompany}</h2>
                          <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">{padSlogan}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 space-y-0.5 font-medium">
                      <div className="flex items-center justify-end gap-1"><MapPin className="w-3 h-3" style={{ color: padColor }} /> {padAddress}</div>
                      <div className="flex items-center justify-end gap-1"><Phone className="w-3 h-3" style={{ color: padColor }} /> {padPhone}</div>
                      <div className="flex items-center justify-end gap-1"><Mail className="w-3 h-3" style={{ color: padColor }} /> {padEmail}</div>
                      <div className="flex items-center justify-end gap-1"><Globe className="w-3 h-3" style={{ color: padColor }} /> {padWeb}</div>
                    </div>
                  </div>

                  {/* Pad Body Area */}
                  <div className="flex-1 py-10 px-2 sm:px-6">
                    <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {padBody}
                    </div>
                  </div>

                  {/* Pad Footer */}
                  <div className="border-t pt-4 flex justify-between items-end text-[9px] text-slate-400 font-medium">
                    <div>
                      <p className="font-semibold text-slate-500">{padCompany}</p>
                      <p>Corporate Office Pad & Stationery Services</p>
                    </div>
                    <div className="text-right">
                      <p>Page 1 of 1</p>
                      <p className="text-[8px] italic">Generated via Auto PadGen System</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CORPORATE VISITING CARD */}
              {activeTab === 'card' && (
                <div className="flex flex-col justify-between h-full w-full relative z-10 text-white p-2" style={{ backgroundColor: cardColor }}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
                        <Landmark className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black tracking-tight uppercase">{cardCompany}</span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>

                  <div className="my-auto space-y-0.5">
                    <h3 className="text-lg font-black tracking-tight">{cardName}</h3>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{cardDesignation}</p>
                  </div>

                  <div className="border-t border-white/10 pt-2 flex justify-between items-center text-[8px] text-slate-400">
                    <div className="space-y-0.5">
                      <p className="flex items-center gap-1"><Phone className="w-2.5 h-2.5 text-slate-300" /> {cardPhone}</p>
                      <p className="flex items-center gap-1"><Mail className="w-2.5 h-2.5 text-slate-300" /> {cardEmail}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="flex items-center gap-1 justify-end"><Globe className="w-2.5 h-2.5 text-slate-300" /> {cardWeb}</p>
                      <p className="flex items-center gap-1 justify-end"><MapPin className="w-2.5 h-2.5 text-slate-300" /> {cardAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NOC LETTER (A4) */}
              {activeTab === 'noc' && (
                <div className="flex flex-col justify-between h-full w-full relative z-10 font-sans text-xs sm:text-sm">
                  {/* Top Header of corporate letterhead */}
                  <div className="border-b pb-3 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-black text-indigo-700 tracking-tight">{padCompany}</h2>
                      <p className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">{padSlogan}</p>
                    </div>
                    <div className="text-right text-[8px] text-slate-400">
                      <p>{padAddress}</p>
                      <p>{padPhone} | {padEmail}</p>
                    </div>
                  </div>

                  {/* NOC Content */}
                  <div className="flex-1 py-8 space-y-6">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Ref: <span className="font-bold text-slate-800">{nocRef}</span></span>
                      <span>Date: <span className="font-bold text-slate-800">{nocDate}</span></span>
                    </div>

                    <div className="text-center py-2">
                      <h3 className="text-base font-black uppercase tracking-wider border-b-2 border-slate-800 inline-block px-4 pb-1">
                        To Whom It May Concern
                      </h3>
                    </div>

                    <div className="space-y-4 text-slate-700 leading-relaxed text-justify">
                      <p>
                        This is to certify that <span className="font-black text-slate-900">{nocEmpName}</span>, holder of Passport No: <span className="font-bold text-slate-900 uppercase">{nocPassport}</span>, is a permanent employee of <span className="font-semibold text-slate-800">{padCompany}</span>. He has been serving with our organization since <span className="font-semibold text-slate-800">{nocJoinDate}</span>, and currently holds the position of <span className="font-semibold text-slate-800">{nocDesg}</span>. His current monthly gross salary is <span className="font-semibold text-slate-800">{nocSalary}</span>.
                      </p>
                      <p>
                        We have been informed that he is planning to travel to <span className="font-bold text-indigo-600">{nocDestination}</span> for the purpose of <span className="font-semibold text-slate-800">{nocPurpose}</span>. 
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">{padCompany}</span> has no objection to his international travel. All expenses related to his journey, stay, and personal travel will be completely borne by himself. Our organization fully supports his travels and expects him to resume his active duties immediately upon return.
                      </p>
                      <p>
                        We wish him a safe, successful, and pleasant journey ahead.
                      </p>
                    </div>

                    {/* Signature Space */}
                    <div className="pt-10 space-y-1 w-48">
                      <div className="h-0.5 bg-slate-300 w-full" />
                      <p className="font-bold text-slate-800">Authorized Signature</p>
                      <p className="text-[10px] text-slate-500">Managing Director</p>
                      <p className="text-[9px] text-slate-400">{padCompany}</p>
                    </div>
                  </div>

                  {/* NOC Footer */}
                  <div className="border-t pt-3 flex justify-between items-center text-[8px] text-slate-400">
                    <span>{padWeb}</span>
                    <span>Confidential Employee Document</span>
                  </div>
                </div>
              )}

              {/* TAB 4: OFFICE ID CARD */}
              {activeTab === 'idcard' && (
                <div className="flex flex-col justify-between h-full w-full relative z-10 text-slate-800 items-center p-4" style={{ borderTop: `15px solid ${idColor}` }}>
                  <div className="text-center space-y-0.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">{padCompany}</h3>
                    <p className="text-[8px] text-slate-400">OFFICIAL EMPLOYEE ID</p>
                  </div>

                  {/* Photo Area */}
                  <div className="w-24 h-28 bg-slate-100 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center text-slate-400 p-1 relative overflow-hidden shadow-md my-2">
                    <User className="w-12 h-12 text-slate-300" />
                    <span className="text-[8px] text-slate-400 mt-1 uppercase">Photo Area</span>
                  </div>

                  {/* ID Details */}
                  <div className="text-center space-y-1 w-full">
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">{idName}</h4>
                    <span className="inline-block text-[9px] text-white px-2 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: idColor }}>
                      {idDept}
                    </span>
                    
                    <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-500 pt-2 border-t border-slate-100 text-left px-4">
                      <div>ID NO: <span className="font-bold text-slate-800">{idEmpId}</span></div>
                      <div>BLOOD: <span className="font-bold text-red-600">{idBlood}</span></div>
                      <div>JOINED: <span className="font-bold text-slate-800">{idJoined}</span></div>
                      <div>EMERGENCY: <span className="font-bold text-slate-800">{idPhone}</span></div>
                    </div>
                  </div>

                  <div className="text-[7px] text-slate-400 pt-2 text-center w-full uppercase tracking-wider">
                    Property of {padCompany} * If found, please return.
                  </div>
                </div>
              )}

              {/* TAB 5: COVER LETTER */}
              {activeTab === 'cover' && (
                <div className="flex flex-col justify-between h-full w-full relative z-10 font-sans text-xs sm:text-sm">
                  {/* Small Letterhead Logo Header */}
                  <div className="border-b pb-2 flex justify-between items-center text-slate-400 text-[8px]">
                    <span className="font-bold text-indigo-700 uppercase tracking-widest">{padCompany}</span>
                    <span>{padPhone} | {padEmail}</span>
                  </div>

                  {/* Letter Content */}
                  <div className="flex-1 py-6 space-y-4">
                    <div className="text-slate-500 font-mono text-[9px]">Date: 30 July 2026</div>
                    
                    <div className="space-y-0.5 text-slate-700">
                      <p className="font-bold text-slate-900">{covRecipient}</p>
                      <p>{covCompany}</p>
                      <p className="text-slate-500">{covAddress}</p>
                    </div>

                    <div className="font-bold text-slate-900 text-sm">
                      Subject: {covSubject}
                    </div>

                    <div className="text-slate-800 leading-relaxed">
                      <p className="mb-3 font-semibold">{covSalutation}</p>
                      <p className="whitespace-pre-line text-justify text-slate-700 leading-relaxed font-sans">{covBody}</p>
                    </div>

                    <div className="pt-6 space-y-0.5 text-slate-700">
                      <p>Sincerely yours,</p>
                      <p className="font-bold text-slate-900 text-sm">{idName}</p>
                      <p className="text-slate-500">{nocDesg}</p>
                    </div>
                  </div>

                  <div className="text-center text-[7px] text-slate-400 uppercase tracking-wider pt-2 border-t">
                    {padCompany} - {padWeb}
                  </div>
                </div>
              )}

              {/* TAB 6: ROUND SEAL / STAMP */}
              {activeTab === 'seal' && (
                <div className="flex flex-col justify-center items-center h-full w-full relative z-10 bg-transparent p-0">
                  <div 
                    className="rounded-full flex flex-col items-center justify-center select-none relative"
                    style={{
                      width: '240px',
                      height: '240px',
                      border: `4px double ${sealColor}`,
                      color: sealColor
                    }}
                  >
                    {/* Inner Circle Border */}
                    <div 
                      className="rounded-full absolute flex flex-col items-center justify-center p-2"
                      style={{
                        width: '180px',
                        height: '180px',
                        border: `1.5px solid ${sealColor}`
                      }}
                    >
                      {/* Inner Straight Text */}
                      <span className="text-base font-black tracking-widest uppercase text-center max-w-[140px] break-words leading-tight">
                        {sealInnerText}
                      </span>
                    </div>

                    {/* Circular Curved Outer Text (SVG Path wrapper) */}
                    <svg className="absolute w-full h-full animate-[spin_60s_linear_infinite]" viewBox="0 0 240 240">
                      <path 
                        id="sealTextPath" 
                        d="M 120, 120 m -85, 0 a 85,85 0 1,1 170,0 a 85,85 0 1,1 -170,0" 
                        fill="none" 
                      />
                      <text className="font-mono text-[10px] font-black" fill={sealColor}>
                        <textPath href="#sealTextPath" startOffset="50%" textAnchor="middle">
                          {sealOuterText}
                        </textPath>
                      </text>
                    </svg>

                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
