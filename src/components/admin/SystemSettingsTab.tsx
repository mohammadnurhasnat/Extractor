import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Server, 
  Database, 
  Cpu, 
  Bell, 
  Sliders, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  ShieldAlert,
  Save,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

interface SystemSettingsTabProps {
  currentUser: {
    id: string;
    email: string;
    name: string;
  };
  onToast: (msg: { message: string; type: 'success' | 'error' | 'info' }) => void;
  usersCount: number;
  logsCount: number;
}

export function SystemSettingsTab({ currentUser, onToast, usersCount, logsCount }: SystemSettingsTabProps) {
  const [defaultDailyLimit, setDefaultDailyLimit] = useState<number>(() => {
    const saved = localStorage.getItem('app_default_daily_limit');
    return saved ? parseInt(saved, 10) : 5;
  });

  const [broadcastNotice, setBroadcastNotice] = useState<string>(() => {
    return localStorage.getItem('app_broadcast_notice') || '';
  });

  const [isNoticeActive, setIsNoticeActive] = useState<boolean>(() => {
    return localStorage.getItem('app_broadcast_notice_active') === 'true';
  });

  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    return localStorage.getItem('app_maintenance_mode') === 'true';
  });

  const [dbLatency, setDbLatency] = useState<number>(18);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    const startTime = performance.now();
    try {
      const res = await fetch('/api/health');
      const duration = Math.round(performance.now() - startTime);
      if (res.ok) {
        setDbLatency(duration || 12);
        onToast({ message: 'সিস্টেম হেলথ চেক সফল! (System response: ' + duration + 'ms)', type: 'success' });
      } else {
        onToast({ message: 'সিস্টেম হেলথে কোনো সমস্যা দেখা গেছে!', type: 'error' });
      }
    } catch (err) {
      onToast({ message: 'নেটওয়ার্ক সংযোগ ত্রুটি!', type: 'error' });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('app_default_daily_limit', defaultDailyLimit.toString());
    localStorage.setItem('app_broadcast_notice', broadcastNotice);
    localStorage.setItem('app_broadcast_notice_active', isNoticeActive ? 'true' : 'false');
    localStorage.setItem('app_maintenance_mode', maintenanceMode ? 'true' : 'false');

    // Trigger storage event for other components if listening
    window.dispatchEvent(new Event('storage'));

    onToast({ 
      message: 'সিস্টেম সেটিং সফলভাবে সংরক্ষণ করা হয়েছে! (Settings saved successfully!)', 
      type: 'success' 
    });
  };

  const handleExportSystemReport = () => {
    try {
      const report = {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.email,
        stats: {
          totalUsers: usersCount,
          totalAuditLogs: logsCount,
          systemLatency: dbLatency + 'ms',
          defaultLimit: defaultDailyLimit
        },
        settings: {
          notice: broadcastNotice,
          noticeActive: isNoticeActive,
          maintenanceMode: maintenanceMode
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `system_report_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      onToast({ message: 'সিস্টেম রিপোর্ট ডাউনলোড করা হয়েছে! (System Report Exported)', type: 'success' });
    } catch (err) {
      onToast({ message: 'এক্সপোর্ট ব্যর্থ হয়েছে!', type: 'error' });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. System Health Status Panel */}
      <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
              System Infrastructure & Live Health
            </h4>
          </div>
          <button
            onClick={handleCheckHealth}
            disabled={isCheckingHealth}
            className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            <span>Check Latency</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Firestore Database</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Connected ({dbLatency}ms)</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">AI OCR Engine</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Gemini 2.5 Active</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Server Runtime</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Node.js Express v5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Global System Broadcast & Notice Bar Settings */}
      <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
              System Announcement Banner
            </h4>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isNoticeActive}
              onChange={(e) => setIsNoticeActive(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-zinc-600 peer-checked:bg-indigo-600"></div>
            <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
              {isNoticeActive ? 'Active' : 'Disabled'}
            </span>
          </label>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
            Broadcast Notice Text (Visible to all users at the top)
          </label>
          <input
            type="text"
            value={broadcastNotice}
            onChange={(e) => setBroadcastNotice(e.target.value)}
            placeholder="উদাহরণ: নতুন ইন্ডিয়ান রেফারেন্স হেল্পার যুক্ত করা হয়েছে! বা সিস্টেম অপটিমাইজেশন চলছে..."
            className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 3. Usage & System Controls */}
      <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            Global Limits & Security Rules
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
              Default Daily Extraction Limit for New Users
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={defaultDailyLimit}
              onChange={(e) => setDefaultDailyLimit(parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Set the default daily scan quota given when a new account is registered.
            </p>
          </div>

          <div className="flex flex-col justify-between">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
              Maintenance Mode
            </label>
            <div className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 ${maintenanceMode ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Restrict Non-Admin Traffic
                </span>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={handleExportSystemReport}
          className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-lg transition flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export System Report (.json)</span>
        </button>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save System Settings</span>
        </button>
      </div>
    </div>
  );
}
