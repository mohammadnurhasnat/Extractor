import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface WelcomeModalProps {
  signInWithGoogle: () => Promise<void>;
  isLoading?: boolean;
}

export function WelcomeModal({ signInWithGoogle, isLoading = false }: WelcomeModalProps) {
  const [localLoading, setLocalLoading] = useState(false);

  const handleSignIn = async () => {
    setLocalLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setLocalLoading(false);
    }
  };

  const showLoading = isLoading || localLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden flex flex-col font-sans"
      >
        <div className="p-8 text-center flex-1 flex flex-col justify-center">
          {!showLoading ? (
            <>
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/10">
                <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-2">Extractor-এ স্বাগতম</h2>
              <p className="text-slate-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
                পাসপোর্ট ডেটা প্রসেসিং, অটোমেটিক ক্লাউড সিঙ্ক এবং গুগল ড্রাইভ ব্যাকআপ সুবিধা অ্যাক্সেস করতে আপনার গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করুন।
              </p>

              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-200 font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.664 0-8.423-3.759-8.423-8.423s3.759-8.423 8.423-8.423c2.037 0 3.847.747 5.247 2.122l3.208-3.208C18.107 1.812 15.353 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.643 0 12.24-4.857 12.24-12.24 0-.613-.057-1.343-.24-1.955H12.24z" />
                  </svg>
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-750 dark:text-zinc-200">গুগল ক্লাউড কানেক্ট হচ্ছে...</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">আপনার ব্রাউজার থেকে সুরক্ষিতভাবে সাইন-ইন করা হচ্ছে।</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/10 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-[9px] text-slate-400 dark:text-zinc-550 leading-relaxed font-sans text-left">
            আপনার সুরক্ষার স্বার্থে পাসপোর্টের সমস্ত ডেটা ও হিস্টোরি এন্ড-টু-এন্ড এনক্রিপ্টেড ব্যাকআপ হিসেবে আপনার ব্যক্তিগত গুগল ড্রাইভে সংরক্ষিত হচ্ছে।
          </p>
        </div>
      </motion.div>
    </div>
  );
}
