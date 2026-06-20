import { useState, useCallback } from 'react';
import { HistoryItem } from '../types';

export function useSupabase() {
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('supabase_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('supabase_anon_key') || '');
  
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; isTableNotFound?: boolean } | null>(null);

  const isConfigured = !!supabaseUrl && !!supabaseAnonKey;

  const saveConfig = useCallback((url: string, key: string) => {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', key);
    setSupabaseUrl(url);
    setSupabaseAnonKey(key);
    setTestResult(null);
  }, []);

  const clearConfig = useCallback(() => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setTestResult(null);
  }, []);

  const getSupabaseHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (supabaseUrl) headers['x-supabase-url'] = supabaseUrl.trim();
    if (supabaseAnonKey) headers['x-supabase-anon-key'] = supabaseAnonKey.trim();
    return headers;
  }, [supabaseUrl, supabaseAnonKey]);

  // Test Connection
  const testConnection = useCallback(async (customUrl?: string, customKey?: string) => {
    const activeUrl = customUrl || supabaseUrl;
    const activeKey = customKey || supabaseAnonKey;

    if (!activeUrl || !activeKey) {
      setTestResult({ success: false, message: 'Please enter both Supabase URL and Anon Key!' });
      return false;
    }
    
    setIsTestLoading(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeUrl) headers['x-supabase-url'] = activeUrl.trim();
      if (activeKey) headers['x-supabase-anon-key'] = activeKey.trim();

      const res = await fetch('/api/supabase/test', {
        method: 'POST',
        headers
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setTestResult({ success: true, message: result.message });
        return true;
      } else {
        const isTableNotFound = result.error === 'Table Not Found';
        setTestResult({ 
          success: false, 
          message: result.message || result.error || 'Failed to connect to Supabase.',
          isTableNotFound
        });
        return false;
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Network error connecting to proxy.' });
      return false;
    } finally {
      setIsTestLoading(false);
    }
  }, [supabaseUrl, supabaseAnonKey]);

  // Save/Upsert Item to cloud
  const upsertToCloud = useCallback(async (item: HistoryItem): Promise<boolean> => {
    if (!supabaseUrl || !supabaseAnonKey) return false;
    try {
      const res = await fetch('/api/supabase/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getSupabaseHeaders()
        },
        body: JSON.stringify({ item })
      });
      const result = await res.json();
      return !!(res.ok && result.success);
    } catch (e) {
      console.error('Failed to sync to Supabase', e);
      return false;
    }
  }, [getSupabaseHeaders, supabaseUrl, supabaseAnonKey]);

  // Delete Item from cloud
  const deleteFromCloud = useCallback(async (id: string): Promise<boolean> => {
    if (!supabaseUrl || !supabaseAnonKey) return false;
    try {
      const res = await fetch('/api/supabase/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getSupabaseHeaders()
        },
        body: JSON.stringify({ id })
      });
      const result = await res.json();
      return !!(res.ok && result.success);
    } catch (e) {
      console.error('Failed to delete from Supabase', e);
      return false;
    }
  }, [getSupabaseHeaders, supabaseUrl, supabaseAnonKey]);

  // Fetch history items from cloud
  const fetchFromCloud = useCallback(async (): Promise<HistoryItem[] | null> => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    try {
      const res = await fetch('/api/supabase/fetch', {
        method: 'GET',
        headers: {
          ...getSupabaseHeaders()
        }
      });
      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.data)) {
        return result.data;
      }
      return null;
    } catch (e) {
      console.error('Failed to fetch from Supabase', e);
      return null;
    }
  }, [getSupabaseHeaders, supabaseUrl, supabaseAnonKey]);

  // Sync entire local history to cloud
  const syncLocalHistoryToCloud = useCallback(async (localHistory: HistoryItem[], onProgress?: (msg: string, index: number, total: number) => void): Promise<{ successCount: number; failCount: number }> => {
    let successCount = 0;
    let failCount = 0;
    const total = localHistory.length;

    for (let i = 0; i < total; i++) {
      const item = localHistory[i];
      if (onProgress) {
        onProgress(`Syncing raw record of ${item.data.givenName || 'Unnamed'} (${i + 1}/${total})...`, i + 1, total);
      }
      const success = await upsertToCloud(item);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    return { successCount, failCount };
  }, [upsertToCloud]);

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured,
    isTestLoading,
    testResult,
    setTestResult,
    saveConfig,
    clearConfig,
    testConnection,
    upsertToCloud,
    deleteFromCloud,
    fetchFromCloud,
    syncLocalHistoryToCloud
  };
}
