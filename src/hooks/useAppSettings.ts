import { useState, useEffect } from 'react';

export function useAppSettings() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('passport_app_theme');
    if (saved) return saved === 'dark';
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('passport_app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('passport_app_theme', 'light');
    }
  }, [isDarkMode]);

  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showApiKeyChars, setShowApiKeyChars] = useState(false);

  return {
    isDarkMode, setIsDarkMode,
    isOnline,
    userApiKey, setUserApiKey,
    showApiSettings, setShowApiSettings,
    tempApiKey, setTempApiKey,
    showApiKeyChars, setShowApiKeyChars
  };
}
