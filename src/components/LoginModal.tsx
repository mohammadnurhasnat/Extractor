import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Loader2, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

// 📱 Original official high-fidelity WhatsApp SVG Icon
const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-4 h-4 shrink-0 transition-all duration-300 group-hover:scale-110"
    {...props}
  >
    <path d="M12.031 6.172c-2.656 0-4.817 2.16-4.817 4.817 0 .852.224 1.652.615 2.347l-.653 2.392 2.447-.642c.67.365 1.433.573 2.247.573 2.656 0 4.817-2.16 4.817-4.817s-2.16-4.817-4.817-4.817zm2.648 7.102c-.12.339-.597.625-.916.696-.248.055-.572.089-1.571-.327-1.28-.533-2.105-1.832-2.169-1.917-.064-.085-.516-.685-.516-1.306 0-.622.326-.928.443-1.048.117-.12.254-.15.339-.15.085 0 .17 0 .243.004.081.004.19-.032.29.21.104.252.357.868.389.933.032.065.052.14.01.225-.042.085-.064.138-.127.213-.064.074-.134.166-.191.223-.065.065-.132.134-.057.263.075.129.335.553.72.896.496.442.914.58 1.043.645.129.065.203.054.279-.032.075-.085.322-.375.408-.503.086-.129.17-.107.288-.064.118.043.747.352.875.416.128.064.214.096.246.15.032.054.032.31-.089.65zm-2.671-13.264C5.397.01.06 5.348.06 11.957c.001 2.112.548 4.17 1.587 5.974L0 24l6.335-1.662c1.746.953 3.71 1.455 5.673 1.456 6.613 0 11.95-5.341 11.95-11.953 0-3.204-1.245-6.216-3.513-8.484C18.22.135 15.21.01 12.008.01zm5.513 14.29c-.324-.162-1.917-.946-2.21-1.053-.293-.108-.507-.162-.72.162-.213.324-.827 1.053-1.013 1.267-.187.213-.373.24-.697.078-.324-.162-1.37-.505-2.61-1.611-.965-.86-1.617-1.923-1.806-2.247-.189-.324-.02-.5-.182-.661-.147-.146-.324-.378-.487-.568-.162-.189-.217-.324-.324-.54-.108-.217-.053-.405-.027-.567.027-.162.213-.513.32-.675.107-.162.143-.27.213-.405.071-.135.035-.253-.018-.36-.053-.107-.507-1.222-.693-1.67-.182-.438-.363-.378-.507-.385-.13-.006-.28-.008-.43-.008-.15 0-.394.056-.6.281-.206.225-.788.77-.788 1.877s.804 2.17 1.916 2.32c.112.015 1.8 2.75 4.362 3.855.61.264 1.086.42 1.457.538.613.195 1.172.167 1.613.101.492-.074 1.517-.619 1.73-1.217.213-.598.213-1.11.15-1.217-.063-.108-.231-.162-.555-.324z" />
  </svg>
);

interface LoginModalProps {
  loginIdentifier: string;
  setLoginIdentifier: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string | null;
  isLoggingIn: boolean;
  handleLogin: (e: React.FormEvent) => void;
}

export function LoginModal({
  loginIdentifier,
  setLoginIdentifier,
  loginPassword,
  setLoginPassword,
  loginError,
  isLoggingIn,
  handleLogin,
}: LoginModalProps) {
  useLockBodyScroll(true);
  const [hoverColor, setHoverColor] = useState('#2563eb');

  const handleButtonMouseEnter = () => {
    const colors = ['#2563eb', '#4f46e5', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#7c3aed'];
    setHoverColor(colors[Math.floor(Math.random() * colors.length)]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", duration: 0.35 }}
        className="relative bg-white dark:bg-[#0a0a0a] shadow-[0_8px_0_0_rgba(148,163,184,0.3)] dark:shadow-[0_8px_0_0_rgba(9,9,11,0.5)] border border-slate-300 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-[280px] sm:max-w-[320px] rounded-[4px] text-black dark:text-white transition-all duration-300 transform -translate-y-[4px]"
      >
        {/* Top Accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />

        {/* Header */}
        <div className="py-2 px-3 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-center bg-slate-50 dark:bg-zinc-900/60 relative z-10">
          <div className="flex items-center justify-center">
            <span className="font-bold text-[8.5px] tracking-tight text-slate-500 dark:text-zinc-400">
              Auto Logout After 30 Minutes Of Inactivity
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="px-4 pt-3 text-center relative z-10">
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-zinc-50 leading-tight">
            Login Verification
          </h2>
        </div>

        {loginError && (
          <div className="mx-4 mt-2 p-1.5 bg-rose-500/5 border border-rose-500/15 rounded-[4px] flex items-start gap-1 text-[9px] font-semibold text-rose-600 dark:text-rose-400 relative z-10">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="p-4 space-y-2 relative z-10">
          <div className="mb-2">
            <label className="block text-[8.5px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1 px-0.5">
              Email or Mobile Number
            </label>
            <input
              type="text"
              required
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="e.g. admin@example.com"
              className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-zinc-700 rounded-[4px] text-[11px] bg-slate-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 text-slate-900 dark:text-white font-semibold transition-all placeholder-slate-400 dark:placeholder-zinc-500 shadow-sm"
            />
          </div>

          <div className="mb-2">
            <label className="block text-[8.5px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1 px-0.5">
              Security Password
            </label>
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-zinc-700 rounded-[4px] text-[11px] bg-slate-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 text-slate-900 dark:text-white font-semibold transition-all placeholder-slate-400 dark:placeholder-zinc-500 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="slide-btn slide-btn-orange w-full py-2.5 rounded-xl font-bold text-sm min-h-[44px] flex items-center justify-center gap-2 mt-2"
          >
            <span className="relative z-10 flex items-center gap-1.5 uppercase tracking-wider">
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </span>
          </button>
          {/* WhatsApp Support Section */}
          <div className="mt-3.5 text-center flex flex-col items-center justify-center gap-2 border-t border-slate-200 dark:border-zinc-800/80 pt-3">
            <span className="text-[8.5px] font-bold text-slate-500 dark:text-zinc-400 leading-normal px-1">
              Need an account? Click WhatsApp for Passcode.
            </span>
            <a
              href="https://wa.me/8801861186863"
              className="slide-btn slide-btn-whatsapp w-full max-w-[200px] py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider ripple-btn"
            >
              <span className="relative z-10 flex items-center gap-1">
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </span>
            </a>

          </div>
        </form>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-slate-100 dark:border-zinc-900/80 bg-white/60 dark:bg-zinc-950/60 relative z-10 flex items-center justify-center text-[8px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
          <span>AUTHORIZED ACCESS ONLY</span>
        </div>
      </motion.div>
    </div>
  );
}
