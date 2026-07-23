import React, { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function BroadcastBanner() {
  const [noticeText, setNoticeText] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const fetchLiveSettings = async () => {
    try {
      const res = await fetch('/api/system-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setNoticeText(data.settings.broadcastNotice || '');
          setIsActive(!!data.settings.isNoticeActive);
          localStorage.setItem('app_broadcast_notice', data.settings.broadcastNotice || '');
          localStorage.setItem('app_broadcast_notice_active', data.settings.isNoticeActive ? 'true' : 'false');
          return;
        }
      }
    } catch (err) {
      // Fallback to local storage
    }

    const text = localStorage.getItem('app_broadcast_notice') || '';
    const active = localStorage.getItem('app_broadcast_notice_active') === 'true';
    setNoticeText(text);
    setIsActive(active);
  };

  useEffect(() => {
    fetchLiveSettings();

    // Firestore real-time listener for instant zero-reload announcement sync
    let unsubscribe: (() => void) | null = null;
    try {
      const settingsDocRef = doc(db, 'system_settings', 'global');
      unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notice = data.broadcastNotice || '';
          const active = !!data.isNoticeActive;
          setNoticeText(notice);
          setIsActive(active);
          localStorage.setItem('app_broadcast_notice', notice);
          localStorage.setItem('app_broadcast_notice_active', active ? 'true' : 'false');
        }
      }, (err) => {
        console.warn("Firestore settings snapshot listener error:", err);
      });
    } catch (e) {
      console.warn("Could not set up settings snapshot listener:", e);
    }

    const handleStorageChange = () => {
      fetchLiveSettings();
    };

    const handleCustomUpdate = () => {
      fetchLiveSettings();
    };

    const handleFocus = () => {
      fetchLiveSettings();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app_settings_updated', handleCustomUpdate);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app_settings_updated', handleCustomUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (!isActive || !noticeText.trim() || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md relative z-30 border-b border-indigo-500/30"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="p-1 bg-white/20 rounded-full shrink-0 animate-pulse">
              <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </span>
            <span className="font-bold uppercase text-[10px] sm:text-xs tracking-wider bg-white/20 px-2 py-0.5 rounded-md shrink-0">
              ঘোষণা / NOTICE
            </span>
            <p className="truncate text-white/95 font-semibold">
              {noticeText}
            </p>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/20 rounded-lg transition shrink-0 text-white/80 hover:text-white"
            title="পপআপ বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
