import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  FileText, 
  Download, 
  Calendar, 
  Search, 
  RefreshCw,
  Clock
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
    
    // Start of this month (calendar month)
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
      businessPads: { today: 0, week: 0, month: 0, total: 0 },
      visitingCards: { today: 0, week: 0, month: 0, total: 0 },
      downloads: { today: 0, week: 0, month: 0, total: 0 }
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
      
      // Handle Business Pads
      if (log.action === 'PAD_DOWNLOAD') {
        stats.businessPads.total++;
        if (isToday) stats.businessPads.today++;
        if (isThisWeek) stats.businessPads.week++;
        if (isThisMonth) stats.businessPads.month++;
      }

      // Handle Visiting Cards
      if (log.action === 'CARD_DOWNLOAD') {
        stats.visitingCards.total++;
        if (isToday) stats.visitingCards.today++;
        if (isThisWeek) stats.visitingCards.week++;
        if (isThisMonth) stats.visitingCards.month++;
      }

      // Handle all downloads/exports
      if (['PDF_DOWNLOAD', 'UNDERTAKING_DOWNLOAD', 'IMAGE_TO_PDF', 'PAD_DOWNLOAD', 'CARD_DOWNLOAD'].includes(log.action)) {
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
    const userMap: { [userId: string]: { extractions: number; undertakings: number; imageToPdf: number; businessPads: number; visitingCards: number; total: number } } = {};

    // Initialize all users from database so we see 0 stats too
    users.forEach(u => {
      userMap[u.id] = { extractions: 0, undertakings: 0, imageToPdf: 0, businessPads: 0, visitingCards: 0, total: 0 };
    });

    // Populate stats from logs
    logs.forEach(log => {
      const uId = log.userId;
      if (!userMap[uId]) {
        userMap[uId] = { extractions: 0, undertakings: 0, imageToPdf: 0, businessPads: 0, visitingCards: 0, total: 0 };
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
      } else if (log.action === 'PAD_DOWNLOAD') {
        userMap[uId].businessPads++;
        userMap[uId].total++;
      } else if (log.action === 'CARD_DOWNLOAD') {
        userMap[uId].visitingCards++;
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
        <span className="text-xs text-slate-400 font-bold">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper header action */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900/50">
        <div>
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Usage Analytics</span>
          </h4>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
            Realtime performance & utilization insights
          </p>
        </div>
        <button 
          onClick={onRefresh} 
          className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold flex items-center gap-1.5 text-blue-500 dark:text-blue-400 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Account summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Admin accounts */}
        <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-lg border border-amber-200/60 dark:border-amber-900/30 flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Admin Accounts</span>
            <span className="text-base font-extrabold block tracking-tight text-amber-950 dark:text-amber-100">
              {accountsSummary.adminCount}
            </span>
          </div>
        </div>

        {/* Total User accounts */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3.5 rounded-lg border border-blue-200/60 dark:border-blue-900/30 flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Customer Accounts</span>
            <span className="text-base font-extrabold block tracking-tight text-blue-950 dark:text-blue-100">
              {accountsSummary.userCount}
            </span>
          </div>
        </div>

        {/* Total Extractions */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/30 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Total Extractions</span>
            <span className="text-base font-extrabold block tracking-tight text-emerald-950 dark:text-emerald-100">
              {metrics.extractions.total}
            </span>
          </div>
        </div>

        {/* Total Downloads */}
        <div className="bg-rose-50 dark:bg-rose-950/20 p-3.5 rounded-lg border border-rose-200/60 dark:border-rose-900/30 flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-md">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">Total Downloads</span>
            <span className="text-base font-extrabold block tracking-tight text-rose-950 dark:text-rose-100">
              {metrics.downloads.total}
            </span>
          </div>
        </div>
      </div>

      {/* Period Table Grid (Daily, Weekly, Monthly Summary) */}
      <div className="bg-white dark:bg-zinc-950/20 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="bg-slate-100 dark:bg-zinc-900 p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-zinc-200">Activity Period Matrix</h5>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider bg-slate-50 dark:bg-zinc-950/40">
                <th className="p-3 text-slate-700 dark:text-slate-300">Activity Type</th>
                <th className="p-3 text-center text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20 border-b-2 border-sky-400/50">Today</th>
                <th className="p-3 text-center text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-b-2 border-indigo-400/50">This Week</th>
                <th className="p-3 text-center text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 border-b-2 border-violet-400/50">This Month</th>
                <th className="p-3 text-center text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50/50 dark:bg-fuchsia-950/20 border-b-2 border-fuchsia-400/50">All Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
              <tr className="hover:bg-blue-50/50 dark:hover:bg-blue-950/10 border-l-4 border-blue-500 transition-colors group">
                <td className="p-3 font-semibold text-blue-800 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-900/10">
                  Passport Extractions
                </td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-sky-50/30 dark:group-hover:bg-sky-900/10">{metrics.extractions.today}</td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10">{metrics.extractions.week}</td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-violet-50/30 dark:group-hover:bg-violet-900/10">{metrics.extractions.month}</td>
                <td className="p-3 text-center font-black text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50/30 dark:bg-fuchsia-900/10">{metrics.extractions.total}</td>
              </tr>
              <tr className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 border-l-4 border-emerald-500 transition-colors group">
                <td className="p-3 font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-900/10">
                  Undertakings Downloaded
                </td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-sky-50/30 dark:group-hover:bg-sky-900/10">{metrics.undertakings.today}</td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10">{metrics.undertakings.week}</td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-violet-50/30 dark:group-hover:bg-violet-900/10">{metrics.undertakings.month}</td>
                <td className="p-3 text-center font-black text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50/30 dark:bg-fuchsia-900/10">{metrics.undertakings.total}</td>
              </tr>
              <tr className="hover:bg-amber-50/50 dark:hover:bg-amber-950/10 border-l-4 border-amber-500 transition-colors group">
                <td className="p-3 font-semibold text-amber-800 dark:text-amber-300 bg-amber-50/30 dark:bg-amber-900/10">
                  Business Pads
                </td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-sky-50/30 dark:group-hover:bg-sky-900/10">{metrics.businessPads.today}</td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10">{metrics.businessPads.week}</td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-violet-50/30 dark:group-hover:bg-violet-900/10">{metrics.businessPads.month}</td>
                <td className="p-3 text-center font-black text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50/30 dark:bg-fuchsia-900/10">{metrics.businessPads.total}</td>
              </tr>
              <tr className="hover:bg-rose-50/50 dark:hover:bg-rose-950/10 border-l-4 border-rose-500 transition-colors group">
                <td className="p-3 font-semibold text-rose-800 dark:text-rose-300 bg-rose-50/30 dark:bg-rose-900/10">
                  Visiting Cards
                </td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-sky-50/30 dark:group-hover:bg-sky-900/10">{metrics.visitingCards.today}</td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10">{metrics.visitingCards.week}</td>
                <td className="p-3 text-center text-slate-700 dark:text-zinc-200 font-bold group-hover:bg-violet-50/30 dark:group-hover:bg-violet-900/10">{metrics.visitingCards.month}</td>
                <td className="p-3 text-center font-black text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50/30 dark:bg-fuchsia-900/10">{metrics.visitingCards.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* User-wise detailed breakdown list */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            User-wise Performance Breakdown
          </h5>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800/80 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/80 dark:border-zinc-800/80 rounded-lg shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                <th className="p-3">User Details</th>
                <th className="p-3 text-center">Passport Extractions</th>
                <th className="p-3 text-center">Undertakings Downloaded</th>
                <th className="p-3 text-center">Image-to-PDF</th>
                <th className="p-3 text-center">Business Pads</th>
                <th className="p-3 text-center">Visiting Cards</th>
                <th className="p-3 text-center">Total Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
              {userBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">No user information found.</td>
                </tr>
              ) : (
                userBreakdown.map((user, index) => (
                  <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-zinc-950/20' : 'bg-slate-50/50 dark:bg-zinc-900/20'} hover:bg-blue-50/30 dark:hover:bg-blue-950/10`}>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-200">
                          <span>{user.name}</span>
                          {user.isAdmin && (
                            <span className="px-1 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold uppercase tracking-wide">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{user.email || user.mobileNumber}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-zinc-200">
                      {user.extractions}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-zinc-200">
                      {user.undertakings}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-zinc-200">
                      {user.imageToPdf}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-zinc-200">
                      {user.businessPads}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-zinc-200">
                      {user.visitingCards}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
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
          <Clock className="w-4 h-4 text-blue-500" />
          <span>Daily Passport Extraction History</span>
        </h5>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {dailyHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs border border-dashed rounded-lg border-slate-200 dark:border-zinc-800">
              No daily extraction history found.
            </div>
          ) : (
            dailyHistory.map(day => (
              <div key={day.dateStr} className="border border-slate-200/80 dark:border-zinc-800/80 rounded-lg p-3 bg-white dark:bg-zinc-950/40 shadow-sm">
                {/* Date header and daily total */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-800 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">{day.dateStr}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                    Total Extractions: <span className="font-extrabold text-blue-600 dark:text-blue-400">{day.total}</span>
                  </span>
                </div>

                {/* Users activity breakdown on that day */}
                <div className="space-y-1.5 pl-3">
                  {Object.keys(day.users).map(userName => {
                    const uStats = day.users[userName];
                    const details: string[] = [];
                    if (uStats.extractions > 0) details.push(`${uStats.extractions} Extractions`);
                    if (uStats.undertakings > 0) details.push(`${uStats.undertakings} Undertakings`);
                    if (uStats.imageToPdf > 0) details.push(`${uStats.imageToPdf} Image-to-PDF`);

                    return (
                      <div key={userName} className="flex justify-between items-center text-xs py-1 px-2 rounded bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
                        <span className="font-semibold text-slate-700 dark:text-zinc-200">{userName}</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          {details.join(' • ')}
                        </span>
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
