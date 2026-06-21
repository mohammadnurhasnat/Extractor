import React, { useState, useCallback } from 'react';
import { HistoryItem } from '../types';
import { useSupabase } from './useSupabase';

interface UseSupabaseCloudSyncProps {
  supabase: ReturnType<typeof useSupabase>;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
}

export function useSupabaseCloudSync({ supabase, history, setHistory }: UseSupabaseCloudSyncProps) {
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncStatusText, setCloudSyncStatusText] = useState('');

  const handleFetchFromCloud = useCallback(async () => {
    if (!supabase.isConfigured) return;
    setIsSyncingCloud(true);
    setCloudSyncStatusText('ক্লাউড থেকে ডেটা নামানো হচ্ছে...');
    try {
      const cloudItems = await supabase.fetchFromCloud();
      if (cloudItems) {
        if (cloudItems.length === 0) {
          setCloudSyncStatusText('ক্লাউডে কোনো সেভ করা পাসপোর্ট পাওয়া যায়নি!');
          setTimeout(() => setCloudSyncStatusText(''), 4000);
          return;
        }
        
        // Merge strategy: prevent duplicate IDs
        const localMap = new Map<string, typeof history[0]>(history.map(item => [item.id, item]));
        cloudItems.forEach(item => {
          localMap.set(item.id, item);
        });
        const mergedHistory = Array.from(localMap.values()).sort((a, b) => b.timestamp - a.timestamp);
        
        setHistory(mergedHistory);
        setCloudSyncStatusText(`ক্লাউড থেকে ${cloudItems.length} টি পাসপোর্ট রেকর্ড সিনক্রোনাইজ করা হয়েছে!`);
        setTimeout(() => setCloudSyncStatusText(''), 5000);
      } else {
        setCloudSyncStatusText('ক্লাউড থেকে তথ্য রিট্রিভ করা সম্ভব হয়নি। Credentials চেক করুন বা টেবিল তৈরি করুন।');
        setTimeout(() => setCloudSyncStatusText(''), 5000);
      }
    } catch (e: any) {
      setCloudSyncStatusText(`ত্রুটি: ${e.message || 'Error occurred'}`);
      setTimeout(() => setCloudSyncStatusText(''), 5500);
    } finally {
      setIsSyncingCloud(false);
    }
  }, [supabase, history, setHistory]);

  const handleSyncToCloud = useCallback(async () => {
    if (!supabase.isConfigured) return;
    if (history.length === 0) {
      setCloudSyncStatusText('আপলোড করার জন্য কোনো লোকাল হিস্টরি নেই!');
      setTimeout(() => setCloudSyncStatusText(''), 4000);
      return;
    }
    setIsSyncingCloud(true);
    try {
      const result = await supabase.syncLocalHistoryToCloud(history, (msg) => {
        setCloudSyncStatusText(msg);
      });
      setCloudSyncStatusText(`সিনক্রোনাইজেশন সফল! সম্পূর্ণ হয়েছে: ${result.successCount}, ব্যর্থ: ${result.failCount}`);
      setTimeout(() => setCloudSyncStatusText(''), 6000);
    } catch (e: any) {
      setCloudSyncStatusText(`ত্রুটি: ${e.message || 'Error occurred'}`);
      setTimeout(() => setCloudSyncStatusText(''), 5000);
    } finally {
      setIsSyncingCloud(false);
    }
  }, [supabase, history]);

  return {
    isSyncingCloud,
    cloudSyncStatusText,
    handleFetchFromCloud,
    handleSyncToCloud
  };
}
