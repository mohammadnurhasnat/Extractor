import { HistoryItem } from '../types';

export const getTimestampMs = (ts: any): number => {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'string') {
    const parsed = new Date(ts).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof ts === 'object') {
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
    if (typeof ts._seconds === 'number') return ts._seconds * 1000;
  }
  return 0;
};

export const sortHistoryByNewest = (items: HistoryItem[]): HistoryItem[] => {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => getTimestampMs(b.timestamp) - getTimestampMs(a.timestamp));
};
