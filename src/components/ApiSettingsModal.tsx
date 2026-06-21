import React, { useState, useEffect } from 'react';
import { 
  Key, X, Eye, EyeOff, Database, Sparkles, 
  Copy, Check, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  userApiKey: string;
  onClose: () => void;
  onSave: (key: string) => void;
  onClear: () => void;
  
  // Supabase Integration
  supabaseUrl: string;
  supabaseAnonKey: string;
  onSaveSupabase: (url: string, key: string) => void;
  onClearSupabase: () => void;
  testConnection: (url?: string, key?: string) => Promise<boolean>;
  isTestLoading: boolean;
  testResult: { success: boolean; message: string; isTableNotFound?: boolean } | null;
  clearTestResult: () => void;
}

export function ApiSettingsModal({
  isOpen,
  userApiKey,
  onClose,
  onSave,
  onClear,
  supabaseUrl,
  supabaseAnonKey,
  onSaveSupabase,
  onClearSupabase,
  testConnection,
  isTestLoading,
  testResult,
  clearTestResult
}: ApiSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'gemini' | 'supabase'>('gemini');
  
  const [tempApiKey, setTempApiKey] = useState(userApiKey);
  const [showApiKeyChars, setShowApiKeyChars] = useState(false);

  const [tempSupaUrl, setTempSupaUrl] = useState(supabaseUrl);
  const [tempSupaKey, setTempSupaKey] = useState(supabaseAnonKey);
  const [showSupaKeyChars, setShowSupaKeyChars] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Sync state when open or changes
  useEffect(() => {
    if (isOpen) {
      setTempApiKey(userApiKey);
      setTempSupaUrl(supabaseUrl);
      setTempSupaKey(supabaseAnonKey);
    }
  }, [isOpen, userApiKey, supabaseUrl, supabaseAnonKey]);

  const SQL_MIGRATION_CODE = `CREATE TABLE IF NOT EXISTS public.passport_records (
  id text PRIMARY KEY,
  timestamp bigint,
  given_name text,
  surname text,
  gender text,
  dob text,
  birth_place text,
  father_name text,
  mother_name text,
  spouse_name text,
  passport_number text,
  nid_or_birth_cert_number text,
  issue_date text,
  expiry_date text,
  mobile_number text,
  permanent_address text,
  present_address text,
  business_address_dhaka text,
  business_address_local text,
  office_address_dhaka text,
  office_address_local text,
  email text,
  proprietor_business_name text,
  job_company_name text,
  job_role text,
  place_of_issue text,
  birth_place_district text,
  discrepancy_list jsonb,
  custom_undertaking_draft text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row level security (RLS) policies 
ALTER TABLE public.passport_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access" ON public.passport_records FOR ALL USING (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_CODE);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveAll = () => {
    onSave(tempApiKey.trim());
    onSaveSupabase(tempSupaUrl.trim(), tempSupaKey.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" /> Settings Panel
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">API keys are securely kept on client-side state.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selectors */}
            <div className="flex border-b border-slate-100 dark:border-zinc-800/60 px-4 bg-slate-50/20 dark:bg-zinc-950/20">
              <button
                type="button"
                onClick={() => setActiveTab('gemini')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all text-slate-600 dark:text-zinc-400 cursor-pointer ${
                  activeTab === 'gemini' 
                    ? 'border-amber-500 text-slate-900 dark:text-zinc-100 font-semibold' 
                    : 'border-transparent hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Gemini AI Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('supabase');
                  clearTestResult();
                }}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all text-slate-600 dark:text-zinc-400 cursor-pointer ${
                  activeTab === 'supabase' 
                    ? 'border-blue-500 text-slate-900 dark:text-zinc-100 font-semibold' 
                    : 'border-transparent hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-blue-500" /> Supabase Cloud Storage
              </button>
            </div>

            {/* Content Body (Scrollable if SQL area expands) */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {activeTab === 'gemini' ? (
                <div className="space-y-4 animate-fadeIn">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    To avoid Gemini API Key limit issues or errors, save your own <strong>Google Gemini API Key</strong> below. It is stored safely in your browser's <strong>localStorage</strong> and sent securely in server-side headers for each request.
                  </p>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-450 uppercase tracking-wider mb-1.5">
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKeyChars ? 'text' : 'password'}
                        value={tempApiKey || ''}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/25 text-slate-800 dark:text-zinc-100 transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKeyChars(!showApiKeyChars)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-550 hover:text-slate-600 cursor-pointer"
                      >
                        {showApiKeyChars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn text-xs">
                  <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Provide your <strong>Supabase Credentials</strong> below to synchronize your scanned passports and history data securely with your cloud database.
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-450 uppercase tracking-wider mb-1">
                        SUPABASE PROJECT URL
                      </label>
                      <input
                        type="text"
                        value={tempSupaUrl || ''}
                        onChange={(e) => setTempSupaUrl(e.target.value)}
                        placeholder="https://your-project-id.supabase.co"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-550/20 text-slate-800 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-450 uppercase tracking-wider mb-1">
                        SUPABASE ANON KEY / SERVICE ROLE
                      </label>
                      <div className="relative">
                        <input
                          type={showSupaKeyChars ? 'text' : 'password'}
                          value={tempSupaKey || ''}
                          onChange={(e) => setTempSupaKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-550/20 text-slate-800 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSupaKeyChars(!showSupaKeyChars)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-550 hover:text-slate-600 cursor-pointer"
                        >
                          {showSupaKeyChars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions for credentials */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isTestLoading || !tempSupaUrl || !tempSupaKey}
                      onClick={async () => {
                        // Quick save temp values so they can be tested
                        onSaveSupabase(tempSupaUrl.trim(), tempSupaKey.trim());
                        await testConnection(tempSupaUrl.trim(), tempSupaKey.trim());
                      }}
                      className="px-3.5 py-2 bg-blue-600/10 hover:bg-blue-600/25 text-blue-600 dark:text-blue-400 rounded-lg font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isTestLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                      Test Connection
                    </button>
                    {(tempSupaUrl || tempSupaKey) && (
                      <button
                        type="button"
                        onClick={() => {
                          onClearSupabase();
                          setTempSupaUrl('');
                          setTempSupaKey('');
                        }}
                        className="px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/10 rounded-lg font-bold cursor-pointer transition-colors"
                      >
                        Reset Cloud
                      </button>
                    )}
                  </div>

                  {/* Connection Test Results */}
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${
                        testResult.success
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                          : 'bg-rose-500/5 border-rose-500/20 text-rose-800 dark:text-rose-450'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {testResult.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {testResult.success ? 'সুপার সাকসেস!' : 'কানেকশন এরর!'}
                      </div>
                      <p className="text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">{testResult.message}</p>
                    </motion.div>
                  )}

                  {/* Schema query tutorial */}
                  <div className="p-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200/55 dark:border-zinc-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-zinc-200">Supabase SQL Schema Setup</span>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 rounded transition-all cursor-pointer"
                      >
                        {copiedSql ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy SQL
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-550 dark:text-zinc-450 leading-relaxed leading-[1.4]">
                      Supabase Cloud এ ডেটা জমা রাখতে আপনাকে একটি টেবিল তৈরি করতে হবে। আপনার Supabase Dashboard এ লগইন করে বাম পাশের <strong>"SQL Editor"</strong> এ যান, <strong>New query</strong> তে ক্লিক করুন, এবং নিচের কোডটি পেস্ট করে <strong>Run</strong> বোতামটি চাপুন:
                    </p>
                    <pre className="p-2.5 text-[9px] bg-slate-900 text-emerald-400 font-mono rounded border border-slate-800 overflow-x-auto max-h-[120px]">
                      {SQL_MIGRATION_CODE}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
