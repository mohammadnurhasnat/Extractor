import path from 'path';
import fs from 'fs';
import { Firestore } from '@google-cloud/firestore';
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

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'LOGIN' | 'EXTRACTION' | 'LIMIT_CHANGE' | 'USER_ADDED' | 'USER_EDITED' | 'USER_DELETED' | 'USER_SUSPENDED' | 'UNDERTAKING_DOWNLOAD' | 'IMAGE_TO_PDF' | 'PDF_DOWNLOAD';
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
export let db: any = null;

export function getDb() {
  return db;
}

export function setDb(val: any) {
  db = val;
}

export function getAuditLogs(): AuditLog[] {
  try {
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const data = fs.readFileSync(AUDIT_LOGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading audit logs file:', error);
  }
  return [];
}

export function appendAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  try {
    const logs = getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...logs].slice(0, 1000);
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(updatedLogs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing audit logs file:', error);
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

export function getLocalHistory(userId: string): any[] {
  try {
    if (fs.existsSync(HISTORY_STORE_FILE)) {
      const data = fs.readFileSync(HISTORY_STORE_FILE, 'utf8');
      const store: HistoryStore = JSON.parse(data);
      return store[userId] || [];
    }
  } catch (error) {
    console.error('Error reading local history file:', error);
  }
  return [];
}

export function saveLocalHistory(userId: string, item: any) {
  try {
    let store: HistoryStore = {};
    if (fs.existsSync(HISTORY_STORE_FILE)) {
      const data = fs.readFileSync(HISTORY_STORE_FILE, 'utf8');
      store = JSON.parse(data);
    }
    const userHistory = store[userId] || [];
    const filtered = userHistory.filter((i: any) => i.id !== item.id);
    filtered.unshift(item);
    store[userId] = filtered;
    fs.writeFileSync(HISTORY_STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing local history file:', error);
  }
}

export function deleteLocalHistoryItem(userId: string, itemId: string) {
  try {
    if (fs.existsSync(HISTORY_STORE_FILE)) {
      const data = fs.readFileSync(HISTORY_STORE_FILE, 'utf8');
      const store: HistoryStore = JSON.parse(data);
      if (store[userId]) {
        store[userId] = store[userId].filter((i: any) => i.id !== itemId);
        fs.writeFileSync(HISTORY_STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
      }
    }
  } catch (error) {
    console.error('Error deleting local history item:', error);
  }
}

export function clearLocalHistory(userId: string) {
  try {
    if (fs.existsSync(HISTORY_STORE_FILE)) {
      const data = fs.readFileSync(HISTORY_STORE_FILE, 'utf8');
      const store: HistoryStore = JSON.parse(data);
      store[userId] = [];
      fs.writeFileSync(HISTORY_STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
    }
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
  if (!db) return;
  try {
    const snapshot = await db.collection('registered_users').get();
    const existingIds = snapshot.docs.map((doc: any) => doc.id);
    const newIds = new Set(newUsers.map(u => u.id));
    
    const batch = db.batch();
    
    existingIds.forEach((id: string) => {
      if (!newIds.has(id)) {
        const docRef = db.collection('registered_users').doc(id);
        batch.delete(docRef);
      }
    });
    
    newUsers.forEach((user: any) => {
      const docRef = db.collection('registered_users').doc(user.id);
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

    if (process.env.RENDER || (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.K_SERVICE)) {
      console.warn("Running in non-GCP environment (e.g., Render) without credentials. Bypassing Firestore and using local fallbacks.");
      cachedUsers = getUsersStoreLocal();
      db = null;
      return;
    }

    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    db = new Firestore({
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)'
    });

    // Test connectivity and permissions before proceeding to setup real-time listener
    try {
      console.log("Testing Firestore connectivity and permissions...");
      await db.collection('registered_users').limit(1).get();
      console.log("Firestore connectivity and permission test passed!");
    } catch (testError: any) {
      console.warn("Firestore connection test failed:", testError.message || testError);
      const errStr = String(testError.message || testError);
      if (errStr.includes('PERMISSION_DENIED') || errStr.includes('7') || testError.code === 7) {
        console.warn("Permission denied for Firestore. Gracefully disabling Firestore and falling back to local JSON storage.");
        db = null;
        cachedUsers = getUsersStoreLocal();
        return;
      }
    }

    console.log("Firebase Admin SDK initialized on server backend. Setting up real-time listener for users...");
    
    await new Promise<void>((resolve) => {
      let isFirstSnapshot = true;
      db.collection('registered_users').onSnapshot(async (snapshot: any) => {
        try {
          const dbUsers: any[] = [];
          snapshot.forEach((doc: any) => {
            dbUsers.push(doc.data());
          });

          if (dbUsers.length > 0) {
            const seenEmails = new Set<string>();
            const seenMobiles = new Set<string>();
            const uniqueUsers: any[] = [];
            const duplicatesToDelete: string[] = [];

            dbUsers.forEach((user: any) => {
              const emailKey = user.email ? user.email.toLowerCase().trim() : '';
              const mobileKey = user.mobileNumber ? user.mobileNumber.trim() : '';
              
              let isDuplicate = false;
              if (emailKey && seenEmails.has(emailKey)) {
                isDuplicate = true;
              }
              if (mobileKey && seenMobiles.has(mobileKey)) {
                isDuplicate = true;
              }

              if (isDuplicate) {
                duplicatesToDelete.push(user.id);
              } else {
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
              const batch = db.batch();
              duplicatesToDelete.forEach((id: string) => {
                const docRef = db.collection('registered_users').doc(id);
                batch.delete(docRef);
              });
              try {
                await batch.commit();
                console.log("Duplicate user records deleted from Firestore successfully.");
              } catch (delError) {
                console.error("Error deleting duplicate user records from Firestore:", delError);
              }
            }
          } else {
            console.log("Firestore 'registered_users' collection is empty. Seeding with default users database...");
            cachedUsers = getUsersStoreLocal();
            const batch = db.batch();
            cachedUsers.forEach((user: any) => {
              const docRef = db.collection('registered_users').doc(user.id);
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
        db = null; // Gracefully disable Firestore on snapshot error
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("Failed to load users from Firestore. Falling back to local files:", error);
    db = null;
    cachedUsers = getUsersStoreLocal();
  }
}
