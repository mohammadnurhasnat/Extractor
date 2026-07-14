import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  FileText, 
  FileImage, 
  Download, 
  Calendar, 
  Search, 
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  mobileNumber: string;
  password: string;
  name: string;
  dailyLimit?: number;
  isSuspended?: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  details: string;
}

interface AnalyticsTabProps {
  users: User[];
  logs: AuditLog[];
  onRefresh: () => void;
  isLoading: boolean;
}

export function AnalyticsTab({ users, logs, onRefresh, isLoading }: AnalyticsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Calculate Account Summaries
  const accountsSummary = useMemo(() => {
    let adminCount = 0;
    let userCount = 0;

    users.forEach(u => {
      if (u.email && u.email.toLowerCase() === 'mohammadnurhasnat@gmail.com') {
        adminCount++;
      } else {
        userCount++;
      }
    });

    return { adminCount, userCount };
  }, [users]);

  // 2. Helper to check dates
  const dates = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Start of this week (7 days rolling)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Start of this month (rolling or calendar, let's do calendar month)
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      isToday: (d: Date) => d.toDateString() === todayStr,
      isThisWeek: (d: Date) => d >= sevenDaysAgo,
      isThisMonth: (d: Date) => d.getMonth() === currentMonth && d.getFullYear() === currentYear
    };
  }, []);

  // 3. Process Logs into Daily, Weekly, Monthly Stats
  const metrics = useMemo(() => {
    const stats = {
      extractions: { today: 0, week: 0, month: 0, total: 0 },
      undertakings: { today: 0, week: 0, month: 0, total: 0 },
      imageToPdf: { today: 0, week: 0, month: 0, total: 0 },
      downloads: { today: 0, week: 0, month: 0, total: 0 } // Combines all downloads (PDF_DOWNLOAD, UNDERTAKING_DOWNLOAD, etc.)
    };

    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const isToday = dates.isToday(logDate);
      const isThisWeek = dates.isThisWeek(logDate);
      const isThisMonth = dates.isThisMonth(logDate);

      // Handle extractions
      if (log.action === 'EXTRACTION') {
        stats.extractions.total++;
        if (isToday) stats.extractions.today++;
        if (isThisWeek) stats.extractions.week++;
        if (isThisMonth) stats.extractions.month++;
      }

      // Handle undertakings
      if (log.action === 'UNDERTAKING_DOWNLOAD') {
        stats.undertakings.total++;
        if (isToday) stats.undertakings.today++;
        if (isThisWeek) stats.undertakings.week++;
        if (isThisMonth) stats.undertakings.month++;
      }

      // Handle Image to PDF
      if (log.action === 'IMAGE_TO_PDF') {
        stats.imageToPdf.total++;
        if (isToday) stats.imageToPdf.today++;
        if (isThisWeek) stats.imageToPdf.week++;
        if (isThisMonth) stats.imageToPdf.month++;
      }

      // Handle all downloads/exports
      if (['PDF_DOWNLOAD', 'UNDERTAKING_DOWNLOAD', 'IMAGE_TO_PDF'].includes(log.action)) {
        stats.downloads.total++;
        if (isToday) stats.downloads.today++;
        if (isThisWeek) stats.downloads.week++;
        if (isThisMonth) stats.downloads.month++;
      }
    });

    return stats;
  }, [logs, dates]);

  // 4. Process logs into detailed User Breakdown table
  const userBreakdown = useMemo(() => {
    const userMap: { [userId: string]: { extractions: number; undertakings: number; imageToPdf: number; total: number } } = {};

    // Initialize all users from database so we see 0 stats too
    users.forEach(u => {
      userMap[u.id] = { extractions: 0, undertakings: 0, imageToPdf: 0, total: 0 };
    });

    // Populate stats from logs
    logs.forEach(log => {
      const uId = log.userId;
      if (!userMap[uId]) {
        // Handle cases where a log userId might not be in our users list (legacy or system)
        userMap[uId] = { extractions: 0, undertakings: 0, imageToPdf: 0, total: 0 };
      }

      if (log.action === 'EXTRACTION') {
        userMap[uId].extractions++;
        userMap[uId].total++;
      } else if (log.action === 'UNDERTAKING_DOWNLOAD') {
        userMap[uId].undertakings++;
        userMap[uId].total++;
      } else if (log.action === 'IMAGE_TO_PDF') {
        userMap[uId].imageToPdf++;
        userMap[uId].total++;
      } else if (log.action === 'PDF_DOWNLOAD') {
        userMap[uId].total++;
      }
    });

    // Convert map to array with user details
    return Object.keys(userMap).map(uId => {
      const userObj = users.find(u => u.id === uId);
      return {
        id: uId,
        name: userObj ? userObj.name : `Deleted User (${uId})`,
        email: userObj ? userObj.email : 'N/A',
        mobileNumber: userObj ? userObj.mobileNumber : 'N/A',
        isAdmin: userObj ? userObj.email?.toLowerCase() === 'mohammadnurhasnat@gmail.com' : false,
        ...userMap[uId]
      };
    }).filter(u => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term)
      );
    });
  }, [users, logs, searchTerm]);

  // 5. Daily Passport Extraction History & timeline
  const dailyHistory = useMemo(() => {
    const dailyMap: { 
      [dateStr: string]: { 
        total: number; 
        users: { [name: string]: { extractions: number; undertakings: number; imageToPdf: number } };
        timestamp: number;
      } 
    } = {};

    logs.forEach(log => {
      if (!['EXTRACTION', 'UNDERTAKING_DOWNLOAD', 'IMAGE_TO_PDF'].includes(log.action)) return;

      const d = new Date(log.timestamp);
      const dateKey = d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      const dayStartTimestamp = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { total: 0, users: {}, timestamp: dayStartTimestamp };
      }

      // Find user name
      const userObj = users.find(u => u.id === log.userId);
      const userName = userObj ? userObj.name : `User (${log.userId})`;

      if (!dailyMap[dateKey].users[userName]) {
        dailyMap[dateKey].users[userName] = { extractions: 0, undertakings: 0, imageToPdf: 0 };
      }

      if (log.action === 'EXTRACTION') {
        dailyMap[dateKey].total++;
        dailyMap[dateKey].users[userName].extractions++;
      } else if (log.action === 'UNDERTAKING_DOWNLOAD') {
        dailyMap[dateKey].users[userName].undertakings++;
      } else if (log.action === 'IMAGE_TO_PDF') {
        dailyMap[dateKey].users[userName].imageToPdf++;
      }
    });

    // Convert map to sorted array descending by date
    return Object.keys(dailyMap).map(dateStr => ({
      dateStr,
      ...dailyMap[dateStr]
    })).sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, users]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold">পরিসংখ্যান লোড করা হচ্ছে... (Loading analytics...)</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper header action */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900/50">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>ব্যবহারের সার্বিক পরিসংখ্যান (Usage Analytics)</span>
          </h4>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
            Realtime performance & utilization insights
          </p>
        </div>
        <button 
          onClick={onRefresh} 
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold flex items-center gap-1.5 text-blue-500 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Account summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Admin accounts */}
        <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 dark:to-zinc-950 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">এডমিন অ্যাকাউন্ট</span>
            <span className="text-lg font-black block tracking-tight text-indigo-600 dark:text-indigo-400">
              {accountsSummary.adminCount} <span className="text-xs font-bold text-slate-500">Accounts</span>
            </span>
          </div>
        </div>

        {/* Total User accounts */}
        <div className="bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/10 dark:to-zinc-950 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">গ্রাহক অ্যাকাউন্ট</span>
            <span className="text-lg font-black block tracking-tight text-blue-600 dark:text-blue-400">
              {accountsSummary.userCount} <span className="text-xs font-bold text-slate-500">Accounts</span>
            </span>
          </div>
        </div>

        {/* Total Extractions */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-zinc-950 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">সর্বমোট এক্সট্রাকশন</span>
            <span className="text-lg font-black block tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.extractions.total} <span className="text-xs font-bold text-slate-500">Times</span>
            </span>
          </div>
        </div>

        {/* Total Downloads */}
        <div className="bg-gradient-to-br from-teal-50/50 to-white dark:from-teal-950/10 dark:to-zinc-950 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 rounded-lg text-teal-600 dark:text-teal-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">মোট ডাউনলোড / এক্সপোর্ট</span>
            <span className="text-lg font-black block tracking-tight text-teal-600 dark:text-teal-400">
              {metrics.downloads.total} <span className="text-xs font-bold text-slate-500">Actions</span>
            </span>
          </div>
        </div>
      </div>

      {/* Period Table Grid (Daily, Weekly, Monthly Summary) */}
      <div className="bg-white dark:bg-zinc-900/40 rounded-xl border border-slate-200/80 dark:border-zinc-800/85 overflow-hidden shadow-sm">
        <div className="bg-slate-50/80 dark:bg-zinc-900/60 p-3 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h5 className="font-extrabold text-xs uppercase tracking-wider">পর্যায়ভিত্তিক সারসংক্ষেপ (Activity Period Matrix)</h5>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 dark:border-zinc-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30 dark:bg-zinc-950/10">
                <th className="p-3">অ্যাক্টিভিটি টাইপ (Activity Type)</th>
                <th className="p-3 text-center bg-blue-500/5 dark:bg-blue-500/10">আজ (Daily/Today)</th>
                <th className="p-3 text-center bg-indigo-500/5 dark:bg-indigo-500/10">এই সপ্তাহে (Weekly)</th>
                <th className="p-3 text-center bg-emerald-500/5 dark:bg-emerald-500/10">এই মাসে (Monthly)</th>
                <th className="p-3 text-center font-black">সর্বমোট (All Time)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                <td className="p-3 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>পাসপোর্ট এক্সট্রাকশন (Passport Extractions)</span>
                </td>
                <td className="p-3 text-center bg-blue-500/5 dark:bg-blue-500/10 font-bold text-slate-700 dark:text-zinc-200">{metrics.extractions.today}</td>
                <td className="p-3 text-center bg-indigo-500/5 dark:bg-indigo-500/10 font-bold text-slate-700 dark:text-zinc-200">{metrics.extractions.week}</td>
                <td className="p-3 text-center bg-emerald-500/5 dark:bg-emerald-500/10 font-bold text-slate-700 dark:text-zinc-200">{metrics.extractions.month}</td>
                <td className="p-3 text-center font-black text-emerald-600 dark:text-emerald-400">{metrics.extractions.total}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                <td className="p-3 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>অঙ্গীকারনামা ডাউনলোড (Undertakings Downloaded)</span>
                </td>
                <td className="p-3 text-center bg-blue-500/5 dark:bg-blue-500/10 font-bold text-slate-700 dark:text-zinc-200">{metrics.undertakings.today}</td>
                <td className="p-3 text-center bg-indigo-500/5 dark:bg-indigo-500/10 font-bold text-slate-700 dark:text-zinc-200">{metrics.undertakings.week}</td>
                <td className="p-3 text-center bg-emerald-500/5 dark:bg-emerald-500/10 font-bold text-slate-700 dark:text-zinc-200">{metrics.undertakings.month}</td>
                <td className="p-3 text-center font-black text-amber-600 dark:text-amber-500">{metrics.undertakings.total}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                <td className="p-3 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>ছবি থেকে PDF কনভার্শন (Image to PDF)</span>
                </td>
                <td className="p-3 text-center bg-blue-500/5 dark:bg-blue-500/10 font-bold text-slate-700 dark:text-zinc-200">{metrics.imageToPdf.today}</td>
                <td className="p-3 text-center bg-indigo-500/5 dark:bg-indigo-500/10 font-bold text-slate-700 dark:text-zinc-200">{metrics.imageToPdf.week}</td>
                <td className="p-3 text-center bg-emerald-500/5 dark:bg-emerald-500/10 font-bold text-slate-700 dark:text-zinc-200">{metrics.imageToPdf.month}</td>
                <td className="p-3 text-center font-black text-teal-600 dark:text-teal-400">{metrics.imageToPdf.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* User-wise detailed breakdown list */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            ব্যবহারকারী ভিত্তিক বিস্তারিত হিসাব (User-wise Performance Breakdown)
          </h5>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="ইউজার খুজুন (Filter by user)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/80 dark:border-zinc-800/85 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200/80 dark:border-zinc-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3">ব্যবহারকারী (User Details)</th>
                <th className="p-3 text-center">পাসপোর্ট এক্সট্রাকশন</th>
                <th className="p-3 text-center">ডাউনলোডকৃত অঙ্গীকারনামা</th>
                <th className="p-3 text-center">Image-to-PDF রূপান্তর</th>
                <th className="p-3 text-center font-black">মোট অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
              {userBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">কোনো ব্যবহারকারীর তথ্য পাওয়া যায়নি।</td>
                </tr>
              ) : (
                userBreakdown.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-200">
                          <span>{user.name}</span>
                          {user.isAdmin && (
                            <span className="px-1 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-500 font-extrabold uppercase">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{user.email || user.mobileNumber}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-zinc-300">
                      {user.extractions}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-zinc-300">
                      {user.undertakings}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-zinc-300">
                      {user.imageToPdf}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-black text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {user.total}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Passport Extraction History grouped by day */}
      <div className="space-y-3">
        <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>দৈনিক পাসপোর্ট এক্সট্রাকশন হিস্ট্রি (Daily Passport Extraction History)</span>
        </h5>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {dailyHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs border border-dashed rounded-xl border-slate-200 dark:border-zinc-850">
              কোনো দৈনিক হিস্ট্রি পাওয়া যায়নি।
            </div>
          ) : (
            dailyHistory.map(day => (
              <div key={day.dateStr} className="border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 bg-white dark:bg-zinc-950 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
                {/* Date header and daily total */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900/60 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-100">{day.dateStr}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    মোট এক্সট্রাকশন: {day.total} বার
                  </span>
                </div>

                {/* Users activity breakdown on that day */}
                <div className="space-y-2 pl-3">
                  {Object.keys(day.users).map(userName => {
                    const uStats = day.users[userName];
                    return (
                      <div key={userName} className="flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-1 py-1 border-b border-slate-50 dark:border-zinc-900/30 last:border-none">
                        <span className="font-bold text-slate-700 dark:text-zinc-300">{userName}</span>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-zinc-500">
                          {uStats.extractions > 0 && (
                            <span className="bg-emerald-500/5 text-emerald-600 px-1.5 py-0.5 rounded font-semibold border border-emerald-500/10">
                              এক্সট্রাকশন: {uStats.extractions}
                            </span>
                          )}
                          {uStats.undertakings > 0 && (
                            <span className="bg-amber-500/5 text-amber-600 px-1.5 py-0.5 rounded font-semibold border border-amber-500/10">
                              অঙ্গীকারনামা: {uStats.undertakings}
                            </span>
                          )}
                          {uStats.imageToPdf > 0 && (
                            <span className="bg-teal-500/5 text-teal-600 px-1.5 py-0.5 rounded font-semibold border border-teal-500/10">
                              Image-to-PDF: {uStats.imageToPdf}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
