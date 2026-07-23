import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  writeBatch, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import path from 'path';
import fs from 'fs';

// Lightweight wrapper to match the @google-cloud/firestore Admin SDK interface
class ClientFirestoreWrapper {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  collection(collectionName: string) {
    return new ClientCollectionWrapper(this.db, collectionName);
  }

  batch() {
    return new ClientBatchWrapper(this.db);
  }
}

class ClientCollectionWrapper {
  private db: any;
  private path: string;
  private queryConstraints: any[];

  constructor(db: any, path: string, queryConstraints: any[] = []) {
    this.db = db;
    this.path = path;
    this.queryConstraints = queryConstraints;
  }

  doc(docId: string) {
    return new ClientDocWrapper(this.db, `${this.path}/${docId}`);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return new ClientCollectionWrapper(this.db, this.path, [
      ...this.queryConstraints,
      orderBy(field, direction)
    ]);
  }

  limit(n: number) {
    return new ClientCollectionWrapper(this.db, this.path, [
      ...this.queryConstraints,
      limit(n)
    ]);
  }

  async get() {
    let q = collection(this.db, this.path);
    if (this.queryConstraints.length > 0) {
      q = query(q, ...this.queryConstraints) as any;
    }
    const snap = await getDocs(q);
    return {
      docs: snap.docs.map(d => ({
        id: d.id,
        ref: d.ref,
        data: () => d.data()
      })),
      forEach: (cb: any) => {
        snap.forEach(d => {
          cb({
            id: d.id,
            ref: d.ref,
            data: () => d.data()
          });
        });
      },
      size: snap.size
    };
  }

  async add(data: any) {
    const colRef = collection(this.db, this.path);
    const docRef = await addDoc(colRef, data);
    return { id: docRef.id };
  }

  onSnapshot(onNext: any, onError?: any) {
    const colRef = collection(this.db, this.path);
    let q = colRef as any;
    if (this.queryConstraints.length > 0) {
      q = query(colRef, ...this.queryConstraints);
    }
    return onSnapshot(q, (snap: any) => {
      const wrappedSnap = {
        docs: snap.docs.map((d: any) => ({
          id: d.id,
          ref: d.ref,
          data: () => d.data()
        })),
        forEach: (cb: any) => {
          snap.forEach((d: any) => {
            cb({
              id: d.id,
              ref: d.ref,
              data: () => d.data()
            });
          });
        },
        size: snap.size
      };
      onNext(wrappedSnap);
    }, (err: any) => {
      if (onError) onError(err);
    });
  }
}

class ClientDocWrapper {
  private db: any;
  public docPath: string;

  constructor(db: any, docPath: string) {
    this.db = db;
    this.docPath = docPath;
  }

  collection(subCollectionName: string) {
    return new ClientCollectionWrapper(this.db, `${this.docPath}/${subCollectionName}`);
  }

  async get() {
    const docRef = doc(this.db, this.docPath);
    const snap = await getDoc(docRef);
    return {
      id: snap.id,
      exists: snap.exists(),
      data: () => snap.data()
    };
  }

  async set(data: any) {
    const docRef = doc(this.db, this.docPath);
    await setDoc(docRef, data);
  }

  async delete() {
    const docRef = doc(this.db, this.docPath);
    await deleteDoc(docRef);
  }
}

class ClientBatchWrapper {
  private batchInstance: any;
  private db: any;

  constructor(db: any) {
    this.db = db;
    this.batchInstance = writeBatch(db);
  }

  set(docWrapper: ClientDocWrapper, data: any) {
    const docRef = doc(this.db, (docWrapper as any).docPath);
    this.batchInstance.set(docRef, data);
  }

  delete(docWrapper: ClientDocWrapper) {
    const docRef = doc(this.db, (docWrapper as any).docPath);
    this.batchInstance.delete(docRef);
  }

  async commit() {
    await this.batchInstance.commit();
  }
}

let firestore: any = null; // Lightweight wrapper for standard Firebase client SDK

import { USERS_DATABASE } from '../src/users';

const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Automatically migrate files from root to .data directory
const filesToMigrate = [
  { old: 'limits_store.json', new: 'limits_store.json' },
  { old: 'users_store.json', new: 'users_store.json' },
  { old: 'audit_logs.json', new: 'audit_logs.json' },
  { old: 'history_store.json', new: 'history_store.json' }
];

filesToMigrate.forEach(f => {
  const oldPath = path.join(process.cwd(), f.old);
  const newPath = path.join(DATA_DIR, f.new);
  if (fs.existsSync(oldPath)) {
    try {
      fs.copyFileSync(oldPath, newPath);
      fs.unlinkSync(oldPath);
      console.log(`Successfully migrated ${f.old} to hidden storage ${newPath}`);
    } catch (err) {
      console.error(`Error migrating ${f.old}:`, err);
    }
  }
});

const LIMITS_FILE = path.join(DATA_DIR, 'limits_store.json');
const USERS_STORE_FILE = path.join(DATA_DIR, 'users_store.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
const HISTORY_STORE_FILE = path.join(DATA_DIR, 'history_store.json');
const SYSTEM_SETTINGS_FILE = path.join(DATA_DIR, 'system_settings.json');

export interface SystemSettings {
  broadcastNotice: string;
  isNoticeActive: boolean;
  defaultDailyLimit: number;
  maintenanceMode: boolean;
  updatedAt?: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const defaultSettings: SystemSettings = {
    broadcastNotice: '',
    isNoticeActive: false,
    defaultDailyLimit: 5,
    maintenanceMode: false,
    updatedAt: new Date().toISOString()
  };

  try {
    if (firestore) {
      const snap = await firestore.collection('system_settings').doc('global').get();
      if (snap.exists) {
        return { ...defaultSettings, ...snap.data() };
      }
    }
    if (fs.existsSync(SYSTEM_SETTINGS_FILE)) {
      const data = fs.readFileSync(SYSTEM_SETTINGS_FILE, 'utf8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error reading system settings:', error);
  }
  return defaultSettings;
}

export async function saveSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await getSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(SYSTEM_SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    if (firestore) {
      await firestore.collection('system_settings').doc('global').set(updated);
    }
  } catch (error) {
    console.error('Error saving system settings:', error);
  }

  return updated;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'LOGIN' | 'EXTRACTION' | 'LIMIT_CHANGE' | 'USER_ADDED' | 'USER_EDITED' | 'USER_DELETED' | 'USER_SUSPENDED' | 'UNDERTAKING_DOWNLOAD' | 'IMAGE_TO_PDF' | 'PDF_DOWNLOAD' | 'PAD_DOWNLOAD' | 'CARD_DOWNLOAD';
  userId: string;
  details: string;
}

export interface LimitData {
  [userId: string]: {
    date: string;
    count: number;
  };
}

interface HistoryStore {
  [userId: string]: any[];
}

export let cachedUsers: any[] = [];
export function getDb() {
  return firestore;
}

export function setDb(val: any) {
  firestore = val;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    if (firestore) {
      const snapshot = await firestore.collection('audit_logs').orderBy('timestamp', 'desc').limit(1000).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    }
    // Fallback to local
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const data = fs.readFileSync(AUDIT_LOGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading audit logs:', error);
  }
  return [];
}

export async function appendAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  try {
    if (firestore) {
      const newLog: Omit<AuditLog, 'id'> = {
        ...log,
        timestamp: new Date().toISOString()
      };
      await firestore.collection('audit_logs').add(newLog);
      return;
    }
    // Fallback to local
    const logs = await getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...logs].slice(0, 1000);
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(updatedLogs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing audit logs:', error);
  }
}

export function parseUsersTsContent(content: string): any[] {
  try {
    const startMarker = 'export const USERS_DATABASE: User[] = [';
    const endMarker = '];';
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.lastIndexOf(endMarker);
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return [];
    }
    
    let arrayStr = content.slice(startIndex + startMarker.length, endIndex).trim();
    arrayStr = arrayStr.replace(/\/\*[\s\S]*?\*\//g, '');
    
    const lines = arrayStr.split('\n').map(line => {
      const idx = line.indexOf('//');
      if (idx !== -1) {
        return line.slice(0, idx);
      }
      return line;
    });
    arrayStr = lines.join('\n').trim();
    
    const parsed = new Function(`return [${arrayStr}];`)();
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Error parsing src/users.ts manually:', err);
  }
  return [];
}

let cachedHistoryStore: HistoryStore | null = null;

function getHistoryStore(): HistoryStore {
  if (cachedHistoryStore) {
    return cachedHistoryStore;
  }
  try {
    if (fs.existsSync(HISTORY_STORE_FILE)) {
      const data = fs.readFileSync(HISTORY_STORE_FILE, 'utf8');
      if (data.trim()) {
        cachedHistoryStore = JSON.parse(data);
        return cachedHistoryStore || {};
      }
    }
  } catch (error) {
    console.error('Error reading local history file, attempting backup recovery:', error);
    try {
      const backupFile = HISTORY_STORE_FILE + '.bak';
      if (fs.existsSync(backupFile)) {
        const backupData = fs.readFileSync(backupFile, 'utf8');
        cachedHistoryStore = JSON.parse(backupData);
        return cachedHistoryStore || {};
      }
    } catch (e) {
      console.error('Error reading backup history file:', e);
    }
  }
  cachedHistoryStore = {};
  return cachedHistoryStore;
}

function saveHistoryStoreToDisk() {
  if (!cachedHistoryStore) return;
  try {
    const tempFile = HISTORY_STORE_FILE + '.tmp';
    const backupFile = HISTORY_STORE_FILE + '.bak';
    const content = JSON.stringify(cachedHistoryStore, null, 2);
    
    // Atomic write to temporary file
    fs.writeFileSync(tempFile, content, 'utf8');
    
    // Create backup of current valid file if it exists
    if (fs.existsSync(HISTORY_STORE_FILE)) {
      try {
        fs.copyFileSync(HISTORY_STORE_FILE, backupFile);
      } catch (e) {}
    }
    
    // Atomically swap temp file to final location
    fs.renameSync(tempFile, HISTORY_STORE_FILE);
  } catch (error) {
    console.error('Error saving history store to disk:', error);
  }
}

export function getLocalHistory(userId: string): any[] {
  const store = getHistoryStore();
  return store[userId] || [];
}

export function saveLocalHistory(userId: string, item: any) {
  try {
    const store = getHistoryStore();
    const userHistory = store[userId] || [];
    const filtered = userHistory.filter((i: any) => i.id !== item.id);
    filtered.unshift(item);
    store[userId] = filtered;
    saveHistoryStoreToDisk();
  } catch (error) {
    console.error('Error writing local history:', error);
  }
}

export function saveLocalHistoryBulk(userId: string, items: any[]) {
  try {
    const store = getHistoryStore();
    store[userId] = items;
    saveHistoryStoreToDisk();
  } catch (error) {
    console.error('Error writing local history bulk:', error);
  }
}

export function deleteLocalHistoryItem(userId: string, itemId: string) {
  try {
    const store = getHistoryStore();
    if (store[userId]) {
      store[userId] = store[userId].filter((i: any) => i.id !== itemId);
      saveHistoryStoreToDisk();
    }
  } catch (error) {
    console.error('Error deleting local history item:', error);
  }
}

export function clearLocalHistory(userId: string) {
  try {
    const store = getHistoryStore();
    store[userId] = [];
    saveHistoryStoreToDisk();
  } catch (error) {
    console.error('Error clearing local history:', error);
  }
}

export function getUsersStoreLocal(): typeof USERS_DATABASE {
  const USERS_TS_FILE = path.join(process.cwd(), 'src', 'users.ts');
  try {
    const tsExists = fs.existsSync(USERS_TS_FILE);
    const storeExists = fs.existsSync(USERS_STORE_FILE);
    
    if (tsExists) {
      const tsMtime = fs.statSync(USERS_TS_FILE).mtimeMs;
      const storeMtime = storeExists ? fs.statSync(USERS_STORE_FILE).mtimeMs : 0;
      
      if (!storeExists || tsMtime > storeMtime) {
        console.log('src/users.ts has been updated. Syncing backend store from codebase...');
        const tsContent = fs.readFileSync(USERS_TS_FILE, 'utf8');
        const parsedUsers = parseUsersTsContent(tsContent);
        if (parsedUsers && parsedUsers.length > 0) {
          fs.writeFileSync(USERS_STORE_FILE, JSON.stringify(parsedUsers, null, 2), 'utf8');
          return parsedUsers;
        }
      }
    }
    
    if (storeExists) {
      const data = fs.readFileSync(USERS_STORE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading users store file:', error);
  }
  
  try {
    fs.writeFileSync(USERS_STORE_FILE, JSON.stringify(USERS_DATABASE, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing initial users store file:', error);
  }
  return USERS_DATABASE;
}

export function getUsersStore(): typeof USERS_DATABASE {
  if (cachedUsers.length > 0) {
    return cachedUsers;
  }
  return getUsersStoreLocal();
}

export function syncUsersStoreToUsersTs(users: typeof USERS_DATABASE) {
  try {
    const filePath = path.join(process.cwd(), 'src', 'users.ts');
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const startMarker = 'export const USERS_DATABASE: User[] = [';
      const endMarker = '];';
      const startIndex = content.indexOf(startMarker);
      const endIndex = content.lastIndexOf(endMarker);
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const arrayBody = users.map(u => {
          return `  {\n    id: "${u.id}",\n    email: "${u.email}",\n    mobileNumber: "${u.mobileNumber}",\n    password: "${u.password}",\n    name: "${u.name}"${typeof (u as any).dailyLimit === 'number' ? `,\n    dailyLimit: ${(u as any).dailyLimit}` : ''}${u.isSuspended ? `,\n    isSuspended: true` : ''}\n  }`;
        }).join(',\n');
        
        const newContent = content.slice(0, startIndex + startMarker.length) + '\n' + arrayBody + '\n' + content.slice(endIndex);
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Successfully synced Users to src/users.ts');
      }
    }
  } catch (error) {
    console.error('Error syncing users store to src/users.ts:', error);
  }
}

export function saveUsersStoreLocal(users: typeof USERS_DATABASE) {
  try {
    syncUsersStoreToUsersTs(users);
    fs.writeFileSync(USERS_STORE_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing users store file:', error);
  }
}

export async function syncUsersToFirestore(newUsers: typeof USERS_DATABASE) {
  if (!firestore) return;
  try {
    const snapshot = await firestore.collection('registered_users').get();
    const existingIds = snapshot.docs.map((doc: any) => doc.id);
    const newIds = new Set(newUsers.map(u => u.id));
    
    const batch = firestore.batch();
    
    existingIds.forEach((id: string) => {
      if (!newIds.has(id)) {
        const docRef = firestore.collection('registered_users').doc(id);
        batch.delete(docRef);
      }
    });
    
    newUsers.forEach((user: any) => {
      const docRef = firestore.collection('registered_users').doc(user.id);
      batch.set(docRef, user);
    });
    
    await batch.commit();
    console.log(`Firestore sync completed successfully. Synced ${newUsers.length} users.`);
  } catch (err) {
    console.error("Failed to sync users to Firestore:", err);
  }
}

export function saveUsersStore(users: typeof USERS_DATABASE) {
  cachedUsers = users;
  saveUsersStoreLocal(users);
  syncUsersToFirestore(users);
}

export function getLimitData(): LimitData {
  try {
    if (fs.existsSync(LIMITS_FILE)) {
      const data = fs.readFileSync(LIMITS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading limits file:', error);
  }
  return {};
}

export function saveLimitData(data: LimitData) {
  try {
    fs.writeFileSync(LIMITS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing limits file:', error);
  }
}

export function checkAndIncrementLimit(userId: string): { allowed: boolean; remaining: number; count: number } {
  const data = getLimitData();
  const today = new Date().toISOString().split('T')[0];
  
  if (!data[userId]) {
    data[userId] = { date: today, count: 0 };
  }
  
  if (data[userId].date !== today) {
    data[userId].date = today;
    data[userId].count = 0;
  }
  
  const users = getUsersStore();
  const user = users.find(u => u.id === userId);
  const userLimit = (user && typeof user.dailyLimit === 'number') ? user.dailyLimit : 5;
  
  if (data[userId].count >= userLimit) {
    return { allowed: false, remaining: 0, count: data[userId].count };
  }
  
  data[userId].count += 1;
  saveLimitData(data);
  
  return { allowed: true, remaining: userLimit - data[userId].count, count: data[userId].count };
}

export function decrementLimit(userId: string) {
  try {
    const data = getLimitData();
    const today = new Date().toISOString().split('T')[0];
    if (data[userId] && data[userId].count > 0 && data[userId].date === today) {
      data[userId].count -= 1;
      saveLimitData(data);
    }
  } catch (err) {
    console.error('Error decrementing limit:', err);
  }
}

export function getLimitStatus(userId: string): { count: number; remaining: number; limit: number } {
  const data = getLimitData();
  const today = new Date().toISOString().split('T')[0];
  
  const users = getUsersStore();
  const user = users.find(u => u.id === userId);
  const userLimit = (user && typeof user.dailyLimit === 'number') ? user.dailyLimit : 5;
  
  if (!data[userId] || data[userId].date !== today) {
    return { count: 0, remaining: userLimit, limit: userLimit };
  }
  
  return { count: data[userId].count, remaining: Math.max(0, userLimit - data[userId].count), limit: userLimit };
}

export async function loadUsersFromFirestore() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn("firebase-applet-config.json not found. Using local users store fallbacks.");
      cachedUsers = getUsersStoreLocal();
      return;
    }

    if (process.env.RENDER) {
      console.warn("Running in Render environment. Bypassing Firestore and using local fallbacks.");
      cachedUsers = getUsersStoreLocal();
      firestore = null;
      return;
    }

    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const app = initializeApp(firebaseConfig);
    const rawDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    firestore = new ClientFirestoreWrapper(rawDb);

    // Test connectivity and permissions before proceeding to setup real-time listener
    try {
      console.log("Testing Firestore connectivity and permissions...");
      await firestore.collection('registered_users').limit(1).get();
      console.log("Firestore connectivity and permission test passed!");
    } catch (testError: any) {
      console.warn("Firestore connection test failed:", testError.message || testError);
      const errStr = String(testError.message || testError);
      if (errStr.includes('PERMISSION_DENIED') || errStr.includes('7') || testError.code === 7) {
        console.warn("Permission denied for Firestore. Gracefully disabling Firestore and falling back to local JSON storage.");
        firestore = null;
        cachedUsers = getUsersStoreLocal();
        return;
      }
    }

    console.log("Firebase client SDK initialized on server backend. Setting up real-time listener for users...");
    
    await new Promise<void>((resolve) => {
      let isFirstSnapshot = true;
      firestore.collection('registered_users').onSnapshot(async (snapshot: any) => {
        try {
          const dbUsers: any[] = [];
          snapshot.forEach((doc: any) => {
            dbUsers.push(doc.data());
          });

          if (dbUsers.length > 0) {
            const seenIds = new Set<string>();
            const seenEmails = new Set<string>();
            const seenMobiles = new Set<string>();
            const uniqueUsers: any[] = [];
            const duplicatesToDelete: string[] = [];

            dbUsers.forEach((user: any) => {
              if (!user || !user.id) return;
              const emailKey = user.email ? user.email.toLowerCase().trim() : '';
              const mobileKey = user.mobileNumber ? user.mobileNumber.trim() : '';
              
              let isDuplicate = false;
              if (seenIds.has(user.id)) {
                isDuplicate = true;
              } else if (emailKey && seenEmails.has(emailKey)) {
                isDuplicate = true;
              } else if (mobileKey && seenMobiles.has(mobileKey)) {
                isDuplicate = true;
              }

              if (isDuplicate) {
                duplicatesToDelete.push(user.id);
              } else {
                seenIds.add(user.id);
                if (emailKey) seenEmails.add(emailKey);
                if (mobileKey) seenMobiles.add(mobileKey);
                uniqueUsers.push(user);
              }
            });

            console.log(`Successfully synced ${uniqueUsers.length} unique users from Firestore in real-time.`);
            cachedUsers = uniqueUsers;
            saveUsersStoreLocal(cachedUsers);

            if (duplicatesToDelete.length > 0) {
              console.warn(`Found and cleaning up ${duplicatesToDelete.length} duplicate user records in Firestore:`, duplicatesToDelete);
              setTimeout(async () => {
                try {
                  const batch = firestore.batch();
                  duplicatesToDelete.forEach((id: string) => {
                    const docRef = firestore.collection('registered_users').doc(id);
                    batch.delete(docRef);
                  });
                  await batch.commit();
                  console.log("Duplicate user records deleted from Firestore successfully.");
                } catch (delError) {
                  console.error("Error deleting duplicate user records from Firestore:", delError);
                }
              }, 1000);
            }
          } else {
            console.log("Firestore 'registered_users' collection is empty. Seeding with default users database...");
            cachedUsers = getUsersStoreLocal();
            const batch = firestore.batch();
            cachedUsers.forEach((user: any) => {
              const docRef = firestore.collection('registered_users').doc(user.id);
              batch.set(docRef, user);
            });
            await batch.commit();
            console.log("Successfully seeded default users to Firestore.");
          }
          
          if (isFirstSnapshot) {
            isFirstSnapshot = false;
            resolve();
          }
        } catch (innerErr) {
          console.error("Error in onSnapshot listener:", innerErr);
          if (isFirstSnapshot) {
            isFirstSnapshot = false;
            resolve();
          }
        }
      }, (error: any) => {
        console.error("Firestore onSnapshot error:", error);
        firestore = null; // Gracefully disable Firestore on snapshot error
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("Failed to load users from Firestore. Falling back to local files:", error);
    firestore = null;
    cachedUsers = getUsersStoreLocal();
  }
}
