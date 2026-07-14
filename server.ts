import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import helmet from 'helmet';
import { z } from 'zod';
import { USERS_DATABASE } from './src/users';

const LIMITS_FILE = path.join(process.cwd(), 'limits_store.json');
const USERS_STORE_FILE = path.join(process.cwd(), 'users_store.json');
const AUDIT_LOGS_FILE = path.join(process.cwd(), 'audit_logs.json');

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'LOGIN' | 'EXTRACTION' | 'LIMIT_CHANGE' | 'USER_ADDED' | 'USER_EDITED' | 'USER_DELETED' | 'USER_SUSPENDED' | 'UNDERTAKING_DOWNLOAD' | 'IMAGE_TO_PDF' | 'PDF_DOWNLOAD';
  userId: string;
  details: string;
}

function getAuditLogs(): AuditLog[] {
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

function appendAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  try {
    const logs = getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    // Keep last 1000 logs
    const updatedLogs = [newLog, ...logs].slice(0, 1000);
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(updatedLogs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing audit logs file:', error);
  }
}

// Helper to dynamically parse user array from src/users.ts file content
function parseUsersTsContent(content: string): any[] {
  try {
    const startMarker = 'export const USERS_DATABASE: User[] = [';
    const endMarker = '];';
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.lastIndexOf(endMarker);
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return [];
    }
    
    let arrayStr = content.slice(startIndex + startMarker.length, endIndex).trim();
    // Strip block comments /* ... */
    arrayStr = arrayStr.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split into lines, and filter out comments
    const lines = arrayStr.split('\n').map(line => {
      const idx = line.indexOf('//');
      if (idx !== -1) {
        return line.slice(0, idx);
      }
      return line;
    });
    arrayStr = lines.join('\n').trim();
    
    // Evaluate safely via new Function
    const parsed = new Function(`return [${arrayStr}];`)();
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Error parsing src/users.ts manually:', err);
  }
  return [];
}

import { Firestore } from '@google-cloud/firestore';

// Global cache for users
let cachedUsers: any[] = [];
let db: any = null;

async function loadUsersFromFirestore() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn("firebase-applet-config.json not found. Using local users store fallbacks.");
      cachedUsers = getUsersStoreLocal();
      return;
    }

    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    db = new Firestore({
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)'
    });

    console.log("Firebase Admin SDK initialized on server backend. Fetching users from Firestore...");
    const snapshot = await db.collection('registered_users').get();
    
    const dbUsers: any[] = [];
    snapshot.forEach((doc: any) => {
      dbUsers.push(doc.data());
    });

    if (dbUsers.length > 0) {
      console.log(`Successfully loaded ${dbUsers.length} users from Firestore.`);
      cachedUsers = dbUsers;
      // Also write locally as backup/fallback
      saveUsersStoreLocal(cachedUsers);
    } else {
      console.log("Firestore 'registered_users' collection is empty. Seeding with default users database...");
      cachedUsers = getUsersStoreLocal();
      // Seed to Firestore
      const batch = db.batch();
      cachedUsers.forEach((user: any) => {
        const docRef = db.collection('registered_users').doc(user.id);
        batch.set(docRef, user);
      });
      await batch.commit();
      console.log("Successfully seeded default users to Firestore.");
    }
  } catch (error) {
    console.error("Failed to load users from Firestore. Falling back to local files:", error);
    cachedUsers = getUsersStoreLocal();
  }
}

async function syncUsersToFirestore(newUsers: typeof USERS_DATABASE) {
  if (!db) return;
  try {
    const snapshot = await db.collection('registered_users').get();
    const existingIds = snapshot.docs.map((doc: any) => doc.id);
    const newIds = new Set(newUsers.map(u => u.id));
    
    const batch = db.batch();
    
    // Delete removed users
    existingIds.forEach((id: string) => {
      if (!newIds.has(id)) {
        const docRef = db.collection('registered_users').doc(id);
        batch.delete(docRef);
      }
    });
    
    // Set/update all active users
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

// Get dynamic users list, fallback to static USERS_DATABASE
function getUsersStoreLocal(): typeof USERS_DATABASE {
  const USERS_TS_FILE = path.join(process.cwd(), 'src', 'users.ts');
  try {
    const tsExists = fs.existsSync(USERS_TS_FILE);
    const storeExists = fs.existsSync(USERS_STORE_FILE);
    
    if (tsExists) {
      const tsMtime = fs.statSync(USERS_TS_FILE).mtimeMs;
      const storeMtime = storeExists ? fs.statSync(USERS_STORE_FILE).mtimeMs : 0;
      
      // If src/users.ts was modified AFTER the users_store.json (or store does not exist), re-sync from the codebase
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
  
  // If doesn't exist, save the default database and return it
  try {
    fs.writeFileSync(USERS_STORE_FILE, JSON.stringify(USERS_DATABASE, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing initial users store file:', error);
  }
  return USERS_DATABASE;
}

function getUsersStore(): typeof USERS_DATABASE {
  if (cachedUsers.length > 0) {
    return cachedUsers;
  }
  return getUsersStoreLocal();
}

function syncUsersStoreToUsersTs(users: typeof USERS_DATABASE) {
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

function saveUsersStoreLocal(users: typeof USERS_DATABASE) {
  try {
    // Write to TS file first so its mtime is updated
    syncUsersStoreToUsersTs(users);
    // Write to JSON store file second to ensure store mtime is newer when modified from front-end
    fs.writeFileSync(USERS_STORE_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing users store file:', error);
  }
}

function saveUsersStore(users: typeof USERS_DATABASE) {
  cachedUsers = users;
  saveUsersStoreLocal(users);
  syncUsersToFirestore(users);
}


interface LimitData {
  [userId: string]: {
    date: string;
    count: number;
  };
}

function getLimitData(): LimitData {
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

function saveLimitData(data: LimitData) {
  try {
    fs.writeFileSync(LIMITS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing limits file:', error);
  }
}

function checkAndIncrementLimit(userId: string): { allowed: boolean; remaining: number; count: number } {
  const data = getLimitData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD (Universal UTC-based, resets reliably)
  
  if (!data[userId]) {
    data[userId] = { date: today, count: 0 };
  }
  
  // Reset limit count if stored date is different from today
  if (data[userId].date !== today) {
    data[userId].date = today;
    data[userId].count = 0;
  }
  
  // Look up user's daily limit
  const users = getUsersStore();
  const user = users.find(u => u.id === userId);
  const userLimit = (user && typeof user.dailyLimit === 'number') ? user.dailyLimit : 5;
  
  if (data[userId].count >= userLimit) {
    return { allowed: false, remaining: 0, count: data[userId].count };
  }
  
  // Increment count
  data[userId].count += 1;
  saveLimitData(data);
  
  return { allowed: true, remaining: userLimit - data[userId].count, count: data[userId].count };
}

function decrementLimit(userId: string) {
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

function getLimitStatus(userId: string): { count: number; remaining: number; limit: number } {
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

// Define request validation schemas
const ExtractPassportSchema = z.object({
  imageBase64: z.string().min(1, 'Image base64 data is required'),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/i, 'Only JPEG, PNG, and WEBP images are supported'),
});

const ExtractApplicationPdfSchema = z.object({
  pdfBase64: z.string().min(1, 'PDF base64 data is required'),
  mimeType: z.string().regex(/^application\/pdf$/i, 'Only PDF files are supported'),
});

const GenerateAddressesSchema = z.object({
  permanentAddress: z.string().min(1, 'Permanent address is required'),
});

async function startServer() {
  await loadUsersFromFirestore();
  const app = express();
  const PORT = 3000;

  // Add security headers using helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow easy development preview and asset loading
    crossOriginEmbedderPolicy: false,
  }));

  // Increase payload limit for large passport images
  app.use(express.json({ limit: '20mb' }));

  function cleanAddressPrefixes(address: string | undefined): string {
    if (!address) return '';
    return address
      .replace(/\b(?:vill|village|post|p\.o|thana|upazila|dist|district)\b\s*[\.:-]?\s*/gi, '')
      .trim();
  }

  const DISTRICT_POSTAL_CODES: Record<string, string> = {
    dhaka: '1200',
    kishoreganj: '2300',
    sylhet: '3100',
    chittagong: '4000',
    chattogram: '4000',
    gazipur: '1700',
    narayanganj: '1400',
    tangail: '1900',
    faridpur: '7800',
    manikganj: '1800',
    munshiganj: '1500',
    narsingdi: '1600',
    madaripur: '7900',
    gopalganj: '8100',
    rajbari: '7700',
    shariatpur: '8000',
    mymensingh: '2200',
    rajshahi: '6000',
    rangpur: '5400',
    khulna: '9100',
    barisal: '8200',
    barishal: '8200',
    bogra: '5800',
    bogura: '5800',
    jessore: '7400',
    jashore: '7400',
    comilla: '3500',
    cumilla: '3500',
    noakhali: '3800',
    feni: '3900',
    coxsbazar: '4700',
    cox: '4700',
    brahmanbaria: '3400',
    dinajpur: '5200',
    pabna: '6600',
    kushtia: '7000',
    sirajganj: '6700',
    jamalpur: '2000',
    netrokona: '2400',
    sherpur: '2100',
    naogaon: '6500',
    natore: '6400',
    joypurhat: '5900',
    chapainawabganj: '6300',
    gaibandha: '5700',
    kurigram: '5600',
    lalmonirhat: '5500',
    nilphamari: '5300',
    panchagarh: '5000',
    thakurgaon: '5100',
    bagerhat: '9300',
    chuadanga: '7200',
    jhenaidah: '7300',
    magura: '7600',
    meherpur: '7100',
    narail: '7500',
    satkhira: '9400',
    barguna: '8700',
    bhola: '8300',
    jhalokati: '8400',
    patuakhali: '8600',
    pirojpur: '8500',
    bandarban: '4600',
    khagrachhari: '4400',
    rangamati: '4500',
    habiganj: '3300',
    moulvibazar: '3200',
    sunamganj: '3000',
    chandpur: '3600',
    lakshmipur: '3700'
  };

  function appendPostalCodeToAddress(address: string | undefined): string {
    if (!address) return '';
    let cleaned = address.trim();

    // If it already has a 4-digit postcode (e.g. Kishoreganj-2370 or Dhaka-1212)
    const hasPostcode = /\b\d{4}\b/.test(cleaned);
    if (hasPostcode) {
      return cleaned;
    }

    const words = cleaned.toLowerCase().split(/[\s,;-]+/);
    let detectedPostcode = '1000';
    let matchedDistrictKey = '';

    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (DISTRICT_POSTAL_CODES[cleanWord]) {
        detectedPostcode = DISTRICT_POSTAL_CODES[cleanWord];
        matchedDistrictKey = cleanWord;
        break;
      }
    }

    if (matchedDistrictKey) {
      const regex = new RegExp(`\\b(${matchedDistrictKey})\\b`, 'i');
      const match = cleaned.match(regex);
      if (match) {
        const index = cleaned.toLowerCase().lastIndexOf(matchedDistrictKey);
        if (index !== -1) {
          const originalCaseDistrict = cleaned.substring(index, index + matchedDistrictKey.length);
          cleaned = cleaned.substring(0, index) + `${originalCaseDistrict}-${detectedPostcode}` + cleaned.substring(index + matchedDistrictKey.length);
          return cleaned;
        }
      }
    }

    if (!matchedDistrictKey) {
      let hash = 0;
      for (let i = 0; i < cleaned.length; i++) {
        hash = cleaned.charCodeAt(i) + ((hash << 5) - hash);
      }
      const fallbackCodes = ['1200', '2300', '3100', '4000', '1700', '1400', '1900', '7800', '2200', '6000', '5400', '9100', '8200'];
      const fallbackCode = fallbackCodes[Math.abs(hash) % fallbackCodes.length];
      if (cleaned.endsWith(',')) {
        cleaned = cleaned.substring(0, cleaned.length - 1).trim();
      }
      cleaned = `${cleaned}-${fallbackCode}`;
    }

    return cleaned;
  }

  // API Route for Google Login
  app.post('/api/google-login', (req, res) => {
    try {
      const { email, name, photoURL } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email missing.' });
      }

      const users = getUsersStore();
      // Find user matching email
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        if (user.isSuspended) {
          return res.status(403).json({ success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। Users have been suspended. Now, contact support.' });
        }
        // Update user name/photo if needed, but not strictly necessary
        return res.json({ success: true, user });
      } else {
        // Automatically register the user if they log in via Google
        const newUser = {
          id: 'user_' + Date.now(),
          email: email,
          name: name || 'Google User',
          mobileNumber: '',
          password: '', // No password for Google users
          role: 'user' as 'user' | 'admin',
          createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveUsersStore(users);
        
        return res.json({ success: true, user: newUser });
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      res.status(500).json({ success: false, error: 'Internal server error.' });
    }
  });

  // API Route for user login
  app.post('/api/login', (req, res) => {
    try {
      const { loginIdentifier, password } = req.body;
      
      if (!loginIdentifier || !password) {
        return res.status(400).json({ success: false, error: 'Email/Mobile or Password missing.' });
      }

      const users = getUsersStore();
      // Find user matching email or mobileNumber
      const user = users.find(u => 
        (u.email.toLowerCase() === loginIdentifier.toLowerCase() || u.mobileNumber === loginIdentifier) &&
        u.password === password
      );

      if (!user) {
        return res.status(401).json({ success: false, error: 'ভুল ইমেইল/মোবাইল নাম্বার অথবা পাসওয়ার্ড দিয়েছেন।' });
      }

      if (user.isSuspended) {
        return res.status(403).json({ success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। Users have been suspended. Now, contact support.' });
      }

      // Safe user info without password
      const { password: _, ...userSafe } = user;
      
      appendAuditLog({ userId: user.id, action: 'LOGIN', details: `User logged in from ${req.ip}` });
      
      res.json({ success: true, user: userSafe });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Login failed' });
    }
  });

  // API Route to fetch all users (Admin only)
  app.get('/api/admin/users', (req, res) => {
    try {
      const adminId = req.headers['x-user-id']?.toString();
      if (!adminId) {
        return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === adminId);
      if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
        return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat has access.' });
      }

      res.json({ success: true, users });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch users list.' });
    }
  });

  // API Route to add a new user (Admin only)
  app.post('/api/admin/add-user', (req, res) => {
    try {
      const adminId = req.headers['x-user-id']?.toString();
      if (!adminId) {
        return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === adminId);
      if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
        return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat can add users.' });
      }

      const { name, email, mobileNumber, password } = req.body;
      if (!name || !mobileNumber || !password) {
        return res.status(400).json({ success: false, error: 'Name, Mobile Number, and Password are required fields.' });
      }

      // Check if username/mobile or email already exists to avoid conflict
      const identifierExists = users.some(u => 
        u.mobileNumber === mobileNumber || 
        (email && u.email.toLowerCase() === email.toLowerCase())
      );
      if (identifierExists) {
        return res.status(400).json({ success: false, error: 'A user with this Email or Mobile Number already exists.' });
      }

      // Generate a unique ID
      const newUserId = `user_${Date.now()}`;
      const newUser = {
        id: newUserId,
        name,
        email: email || '',
        mobileNumber,
        password,
        dailyLimit: 5 // Default limit
      };

      // 1. Save to Dynamic store (automatically syncs to src/users.ts)
      users.push(newUser);
      saveUsersStore(users);
      
      appendAuditLog({ userId: adminId, action: 'USER_ADDED', details: `Added new user ${newUser.id} (${newUser.email})` });

      res.json({ success: true, user: newUser });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to add user.' });
    }
  });

  // API Route to update a user's daily limit (Admin only)
  app.post('/api/admin/update-user-limit', (req, res) => {
    try {
      const adminId = req.headers['x-user-id']?.toString();
      if (!adminId) {
        return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === adminId);
      if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
        return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat can update user limits.' });
      }

      const { userId, newLimit } = req.body;
      if (!userId || typeof newLimit !== 'number') {
        return res.status(400).json({ success: false, error: 'User ID and numeric limit are required.' });
      }

      const targetUserIndex = users.findIndex(u => u.id === userId);
      if (targetUserIndex === -1) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      // Update in users store
      users[targetUserIndex].dailyLimit = newLimit;
      saveUsersStore(users);
      
      appendAuditLog({ userId: adminId, action: 'LIMIT_CHANGE', details: `Changed daily limit for user ${userId} to ${newLimit}` });

      res.json({ success: true, user: users[targetUserIndex] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to update user limit.' });
    }
  });

  // API Route to suspend/unsuspend a user (Admin only)
  app.post('/api/admin/toggle-suspend', (req, res) => {
    try {
      const adminId = req.headers['x-user-id']?.toString();
      if (!adminId) {
        return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === adminId);
      if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
        return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat can suspend users.' });
      }

      const { userId, isSuspended } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
      }

      const targetUserIndex = users.findIndex(u => u.id === userId);
      if (targetUserIndex === -1) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      // Check to ensure we cannot suspend the admin themselves
      if (users[targetUserIndex].email.toLowerCase() === 'mohammadnurhasnat@gmail.com') {
        return res.status(400).json({ success: false, error: 'Admin account cannot be suspended.' });
      }

      users[targetUserIndex].isSuspended = !!isSuspended;
      saveUsersStore(users);
      
      appendAuditLog({ userId: adminId, action: 'USER_SUSPENDED', details: `${isSuspended ? 'Suspended' : 'Unsuspended'} user ${userId}` });

      res.json({ success: true, user: users[targetUserIndex] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to toggle suspension.' });
    }
  });

  // API Route to delete a user (Admin only)
  app.post('/api/admin/delete-user', (req, res) => {
    try {
      const adminId = req.headers['x-user-id']?.toString();
      if (!adminId) {
        return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === adminId);
      if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
        return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat can delete users.' });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
      }

      const targetUserIndex = users.findIndex(u => u.id === userId);
      if (targetUserIndex === -1) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      // Check to ensure we cannot delete the admin themselves
      if (users[targetUserIndex].email.toLowerCase() === 'mohammadnurhasnat@gmail.com') {
        return res.status(400).json({ success: false, error: 'Admin account cannot be deleted.' });
      }

      users.splice(targetUserIndex, 1);
      saveUsersStore(users);
      
      appendAuditLog({ userId: adminId, action: 'USER_DELETED', details: `Deleted user ${userId}` });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to delete user.' });
    }
  });

  // API Route to edit/update a user's complete details (Admin only)
  app.post('/api/admin/edit-user', (req, res) => {
    try {
      const adminId = req.headers['x-user-id']?.toString();
      if (!adminId) {
        return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === adminId);
      if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
        return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat has access.' });
      }

      const { userId, name, email, mobileNumber, password, dailyLimit } = req.body;
      if (!userId || !name || !mobileNumber || !password) {
        return res.status(400).json({ success: false, error: 'User ID, Name, Mobile Number, and Password are required.' });
      }

      const targetUserIndex = users.findIndex(u => u.id === userId);
      if (targetUserIndex === -1) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      // Check if another user already has the same mobile number or email
      const conflictExists = users.some((u, idx) => 
        idx !== targetUserIndex && 
        (u.mobileNumber === mobileNumber || (email && u.email && u.email.toLowerCase() === email.toLowerCase()))
      );
      if (conflictExists) {
        return res.status(400).json({ success: false, error: 'A different user with this Email or Mobile Number already exists.' });
      }

      // Update in users list
      users[targetUserIndex].name = name;
      users[targetUserIndex].email = email || '';
      users[targetUserIndex].mobileNumber = mobileNumber;
      users[targetUserIndex].password = password;
      if (typeof dailyLimit === 'number') {
        users[targetUserIndex].dailyLimit = dailyLimit;
      }

      saveUsersStore(users);
      
      appendAuditLog({ userId: adminId, action: 'USER_EDITED', details: `Edited details of user ${userId}` });

      res.json({ success: true, user: users[targetUserIndex] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to edit user.' });
    }
  });

  // API Route to fetch audit logs (Admin only)
  app.get('/api/admin/audit-logs', (req, res) => {
    try {
      const adminId = req.headers['x-user-id']?.toString();
      if (!adminId) {
        return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === adminId);
      if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      const logs = getAuditLogs();
      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch audit logs.' });
    }
  });

  // API Route to log an action (used by client to track undertakings, pdf downloads, image-to-pdf, etc.)
  app.post('/api/log-action', (req, res) => {
    try {
      const { userId, action, details } = req.body;
      if (!userId || !action) {
        return res.status(400).json({ success: false, error: 'User ID and action are required.' });
      }
      appendAuditLog({ userId, action, details: details || '' });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to log action.' });
    }
  });

  // API Route for getting current user's daily limit status
  app.get('/api/limit-status/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const status = getLimitStatus(userId);
      res.json({ success: true, ...status });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch limit status' });
    }
  });

  // API Route to fetch passport history for a user
  app.get('/api/history', async (req, res) => {
    try {
      const userId = req.query.userId?.toString();
      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
      }

      const requesterId = req.headers['x-user-id']?.toString();
      if (!requesterId) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === requesterId);
      const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
      
      if (requesterId !== userId && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Forbidden.' });
      }

      if (!db) {
        return res.status(500).json({ success: false, error: 'Database not initialized.' });
      }

      const snapshot = await db.collection('users').doc(userId).collection('history').orderBy('timestamp', 'desc').get();
      const historyItems: any[] = [];
      snapshot.forEach((doc: any) => {
        historyItems.push(doc.data());
      });

      res.json({ success: true, history: historyItems });
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch history.' });
    }
  });

  // API Route to save a history item
  app.post('/api/history', async (req, res) => {
    try {
      const { userId, item } = req.body;
      if (!userId || !item || !item.id) {
        return res.status(400).json({ success: false, error: 'User ID and history item with ID are required.' });
      }

      const requesterId = req.headers['x-user-id']?.toString();
      if (!requesterId) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === requesterId);
      const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
      
      if (requesterId !== userId && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Forbidden.' });
      }

      if (!db) {
        return res.status(500).json({ success: false, error: 'Database not initialized.' });
      }

      // Save to Firestore
      await db.collection('users').doc(userId).collection('history').doc(item.id).set(item);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to save history:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to save history.' });
    }
  });

  // API Route to delete a history item
  app.delete('/api/history/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.query.userId?.toString();
      if (!id || !userId) {
        return res.status(400).json({ success: false, error: 'History item ID and User ID are required.' });
      }

      const requesterId = req.headers['x-user-id']?.toString();
      if (!requesterId) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === requesterId);
      const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
      
      if (requesterId !== userId && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Forbidden.' });
      }

      if (!db) {
        return res.status(500).json({ success: false, error: 'Database not initialized.' });
      }

      await db.collection('users').doc(userId).collection('history').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete history item:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to delete history item.' });
    }
  });

  // API Route to clear all history
  app.post('/api/history/clear', async (req, res) => {
    try {
      const userId = req.query.userId?.toString();
      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
      }

      const requesterId = req.headers['x-user-id']?.toString();
      if (!requesterId) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
      }
      
      const users = getUsersStore();
      const adminUser = users.find(u => u.id === requesterId);
      const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
      
      if (requesterId !== userId && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Forbidden.' });
      }

      if (!db) {
        return res.status(500).json({ success: false, error: 'Database not initialized.' });
      }

      const collectionRef = db.collection('users').doc(userId).collection('history');
      const snapshot = await collectionRef.get();
      
      const batch = db.batch();
      snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to clear history:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to clear history.' });
    }
  });
  
  // API Route for passport extraction
  app.post('/api/extract-passport', async (req, res) => {
    try {
      // Authenticate session via headers or request body
      const userId = (req.headers['x-user-id'] || req.body.userId)?.toString();
      if (!userId) {
        return res.status(200).json({ success: false, error: 'প্রবেশাধিকার পাননি। দয়া করে আগে লগইন করুন।' });
      }

      const users = getUsersStore();
      const user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(200).json({ success: false, error: 'অবৈধ সেশন। দয়া করে আবার লগইন করুন।' });
      }

      if (user.isSuspended) {
        return res.status(200).json({ success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। দয়া করে এডমিনের সাথে যোগাযোগ করুন।' });
      }

      // Enforce 5-Passport Daily Limit
      const limitCheck = checkAndIncrementLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(200).json({ 
          success: false, 
          error: 'আপনার দৈনিক ফ্রী লিমিট (৫টি এক্সট্রাকশন) শেষ হয়ে গেছে। দয়া করে ২৪ ঘণ্টা পর আবার ফ্রী ট্রাই করতে পারবেন।' 
        });
      }

      appendAuditLog({ userId: userId, action: 'EXTRACTION', details: 'Extracted a passport' });

      // Validate input request using Zod
      const parsedBody = ExtractPassportSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(200).json({ 
          success: false, 
          error: parsedBody.error.issues.map(e => e.message).join(', ') 
        });
      }

      let { imageBase64, mimeType } = parsedBody.data;
      if (mimeType.toLowerCase() === 'image/jpg') {
        mimeType = 'image/jpeg';
      }

      const clientApiKey = req.headers['x-api-key']?.toString() || process.env.GEMINI_API_KEY;

      if (!clientApiKey) {
        return res.status(200).json({ 
          success: false,
          error: 'GEMINI_API_KEY is missing. Please set it in your Render Dashboard Environment variables, OR configure it directly in the Extractor UI Settings (gear icon in the top-right of your screen).' 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: clientApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // We expect the frontend to send just the base64 string without the data URI prefix
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

      console.log('⚡ High-Speed Dual-Engine Extraction Pipeline Initiated.');

      const systemInstruction = `You are an ultra-fast, high-precision Passport Extraction & Validation Agent. 
Extract passport data, read and validate Machine-Readable Zone (MRZ) checksums, compute confidence scores, highlight structural discrepancies, and suggest Bangladeshi addresses.

CRITICAL INITIAL QUALITY SCAN:
Before doing any extraction, carefully evaluate the provided image first.
- Is this actually a passport photo/info page?
- Is the passport photo page extremely blurry, out-of-focus, dark, has high glare/reflections, or is of too low quality to confidently read names and passport numbers?
- If the image is NOT a passport, or if it is too blurry/low-quality to read and extract real information accurately (which would lead to hallucination), you MUST set "isValidPassport" to false, and provide a clear, detailed, helpful explanation in Bengali under "validationError" explaining exactly why it cannot be read and asking the user to upload a clear passport photo (e.g. "পাসপোর্ট এর ছবিটি স্পষ্ট নয় বা পড়া যাচ্ছে না। দয়া করে আলোর নিচে একটি স্পষ্ট ও সোজা ছবি তুলে আপলোড করুন।"). For all other fields (finalData, mrzValidation, generatedAddresses, etc.), you can set empty/blank string values or dummy placeholder values as they won't be used.
- If the image is a valid, legible passport page, you MUST set "isValidPassport" to true and "validationError" to "".

INSTRUCTIONS FOR VALID PASSPORTS:
1. OCR: Extract core properties: givenName, surname, dob, birthPlace, fatherName, motherName, spouseName, passportNumber, nidOrBirthCertNumber, issueDate, expiryDate, gender (Male/Female), permanentAddress, mobileNumber.
   - Core visual shapes: Carefully differentiate 'O' vs '0' and 'I' vs '1'.
   - IMPORTANT: Format dob, issueDate, and expiryDate strictly as DD/MM/YYYY (e.g. 15/08/1990).
   - permanentAddress format requirement: It MUST be formatted as exactly four comma-separated sections:
     1st section: Village name (e.g., Goalpur)
     2nd section: Police station / Thana name (e.g., Mithamain)
     3rd section: Post office name (e.g., Goalpur)
     4th section: District name (e.g., Kishoreganj)
     Ensure all 4 fields are populated and the district name is never missing in the final output.
2. MRZ: Read raw MRZ lines into rawMrz array. Populate validation fields (passportNumberChecksum, dobChecksum, expiryDateChecksum, compositeChecksum) with "Pass" or "Fail".
3. Security & Confidence: Match visual details with MRZ properties. List any discrepancies found under discrepancies. Determine overall confidenceScore (0-100). Also estimate individual fieldConfidence scores (0-100) for every field in finalData based on image legibility and MRZ cross-checks.
4. Undertaking: Set customUndertakingDraft to a very short 1-sentence string (e.g., "Full verification of passport data completed.") to optimize processing speed.
5. Address Rules: Base address structures on the permanentAddress classification:
   - Cat 1 (Inside Dhaka District): presentAddress is equal to permanentAddress. Create Dhaka commercial addresses for businessAddressDhaka, officeAddressDhaka. Create local versions for businessAddressLocal, officeAddressLocal.
   - Cat 2 (Dhaka Division, but not Dhaka District): Create a Dhaka City address for presentAddress, businessAddressDhaka, officeAddressDhaka. Create matching local addresses for local fields.
   - Cat 3 (Outside Dhaka Division): Create a Dhaka City address for presentAddress, businessAddressDhaka, officeAddressDhaka. Create matching local addresses for local fields.
   * Dhaka format: "House X, Road Y, [Area], Dhaka-[Postcode]" (No excessive building titles, commercial center tags, or complex names).
   * DHAKA AREA RANDOM DIVERSITY MANDATE: You MUST randomly select different areas for each generated Dhaka address (presentAddress, businessAddressDhaka, officeAddressDhaka). Do NOT use the same area for all three, and do NOT repeatedly default to "Uttara" or "Banani". You MUST rotate and choose randomly from a wide list of areas like: Mirpur, Mohammadpur, Dhanmondi, Gulshan, Badda, Malibagh, Mogbazar, Khilgaon, Bashundhara, Rampura, Shanti Nagar, Wari, Lalbagh, Motijheel, Uttara, etc. For each generated address, pick a randomized area from this list. Do NOT use any hardcoded or fixed mapping between specific fields and specific areas. Ensure that presentAddress is randomly assigned any area from the list (for example, Mirpur, Mohammadpur, Badda, etc.) rather than always defaulting to Uttara.
   * Rules for All addresses: Do NOT include prefix labels or structural tags like 'Vill:', 'Post:', 'Thana:', 'Dist:', 'dist:', 'vill', 'post', 'thana', or 'dist'. Write clean comma-separated names of locations strictly following the 4-section format: "Goalpur, Mithamain, Goalpur, Kishoreganj" instead of "Vill: Goalpur, Thana: Mithamain, Post: Goalpur, Dist: Kishoreganj". Ensure the district name is always added at the very end.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          isValidPassport: { type: Type.BOOLEAN },
          validationError: { type: Type.STRING },
          finalData: {
            type: Type.OBJECT,
            properties: {
              givenName: { type: Type.STRING },
              surname: { type: Type.STRING },
              dob: { type: Type.STRING },
              birthPlace: { type: Type.STRING },
              fatherName: { type: Type.STRING },
              motherName: { type: Type.STRING },
              spouseName: { type: Type.STRING },
              passportNumber: { type: Type.STRING },
              nidOrBirthCertNumber: { type: Type.STRING },
              issueDate: { type: Type.STRING },
              expiryDate: { type: Type.STRING },
              gender: { type: Type.STRING },
              permanentAddress: { type: Type.STRING },
              mobileNumber: { type: Type.STRING }
            },
            required: [
              "givenName", "surname", "dob", "birthPlace", "fatherName", "motherName",
              "spouseName", "passportNumber", "nidOrBirthCertNumber", "issueDate", "expiryDate", "gender", "permanentAddress", "mobileNumber"
            ]
          },
          fieldConfidence: {
            type: Type.OBJECT,
            properties: {
              givenName: { type: Type.INTEGER },
              surname: { type: Type.INTEGER },
              dob: { type: Type.INTEGER },
              birthPlace: { type: Type.INTEGER },
              fatherName: { type: Type.INTEGER },
              motherName: { type: Type.INTEGER },
              spouseName: { type: Type.INTEGER },
              passportNumber: { type: Type.INTEGER },
              nidOrBirthCertNumber: { type: Type.INTEGER },
              issueDate: { type: Type.INTEGER },
              expiryDate: { type: Type.INTEGER },
              gender: { type: Type.INTEGER },
              permanentAddress: { type: Type.INTEGER },
              mobileNumber: { type: Type.INTEGER }
            },
            required: [
              "givenName", "surname", "dob", "birthPlace", "fatherName", "motherName",
              "spouseName", "passportNumber", "nidOrBirthCertNumber", "issueDate", "expiryDate", "gender", "permanentAddress", "mobileNumber"
            ]
          },
          mrzValidation: {
            type: Type.OBJECT,
            properties: {
              rawMrz: { type: Type.ARRAY, items: { type: Type.STRING } },
              passportNumberChecksum: { type: Type.STRING },
              dobChecksum: { type: Type.STRING },
              expiryDateChecksum: { type: Type.STRING },
              compositeChecksum: { type: Type.STRING }
            },
            required: ["rawMrz", "passportNumberChecksum", "dobChecksum", "expiryDateChecksum", "compositeChecksum"]
          },
          discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidenceScore: { type: Type.INTEGER },
          customUndertakingDraft: { type: Type.STRING },
          generatedAddresses: {
            type: Type.OBJECT,
            properties: {
              presentAddress: { type: Type.STRING },
              businessAddressDhaka: { type: Type.STRING },
              businessAddressLocal: { type: Type.STRING },
              officeAddressDhaka: { type: Type.STRING },
              officeAddressLocal: { type: Type.STRING }
            },
            required: ["presentAddress", "businessAddressDhaka", "businessAddressLocal", "officeAddressDhaka", "officeAddressLocal"]
          }
        },
        required: ["isValidPassport", "validationError", "finalData", "fieldConfidence", "mrzValidation", "discrepancies", "confidenceScore", "customUndertakingDraft", "generatedAddresses"]
      };

      let pipelineResponse;
      try {
        console.log('⚡ Running primary engine: gemini-3.1-flash-lite (Target latency: 2-3s)');
        pipelineResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              }
            }
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema
          }
        });
      } catch (err: any) {
        console.warn('⚠️ Primary gemini-3.1-flash-lite engine error, attempting fast fallback (gemini-3.5-flash)...', err.message || err);
        pipelineResponse = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              }
            }
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema
          }
        });
      }

      if (!pipelineResponse.text) {
        throw new Error('Passport extraction failed to return response data.');
      }

      const pipelineData = JSON.parse(pipelineResponse.text);
      console.log('✅ High-Speed Single-Agent Extraction Pipeline Completed.');

      // Validate passport image clarity & validity
      if (pipelineData.isValidPassport === false) {
        console.warn('⚠️ Passport photo validation failed:', pipelineData.validationError);
        decrementLimit(userId);
        return res.status(200).json({
          success: false,
          error: pipelineData.validationError || 'পাসপোর্টের ছবিটি স্পষ্ট নয় অথবা এটি একটি বৈধ পাসপোর্ট নয়। দয়া করে একটি স্পষ্ট পাসপোর্টের ছবি আপলোড করুন।'
        });
      }

      const result = {
        ...pipelineData.finalData,
        fieldConfidence: pipelineData.fieldConfidence,
        discrepancyList: pipelineData.discrepancies,
        customUndertakingDraft: pipelineData.customUndertakingDraft || "",
        permanentAddress: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.finalData.permanentAddress)),
        presentAddress: cleanAddressPrefixes(pipelineData.generatedAddresses.presentAddress),
        businessAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressDhaka),
        businessAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressLocal)),
        officeAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressDhaka),
        officeAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressLocal)),
      };

      const formattedMrzLines = Array.isArray(pipelineData.mrzValidation.rawMrz) 
        ? pipelineData.mrzValidation.rawMrz.map((line: string) => `\`${line}\``).join('\n  ')
        : 'Lines not detected';

      const logLines = [
        `⚡ **High-Speed Single-Agent Extraction Engine**: Extraction completed instantly in a single optimized pass.`,
        `🔍 **OCR & MRZ Reader Specialist**: Successfully scanned layout and read Machine-Readable Zone:\n  ${formattedMrzLines}`,
        `   - Passport No Checksum Validation: **${pipelineData.mrzValidation.passportNumberChecksum}**`,
        `   - Date of Birth Checksum Validation: **${pipelineData.mrzValidation.dobChecksum}**`,
        `   - Expiry Date Checksum Validation: **${pipelineData.mrzValidation.expiryDateChecksum}**`,
        `   - Composite Checksum Validation: **${pipelineData.mrzValidation.compositeChecksum}**`,
        `🛡️ **Data Guardian System**: Performed comprehensive visual-to-MRZ checksum checks. Overall confidence is **${pipelineData.confidenceScore}%** with **${pipelineData.discrepancies.length}** discrepancy alerts.`,
        `📍 **Bangladeshi Address Generator**: Automatically classified boundaries to construct synchronized residence and professional address layouts.`
      ];
      result.agentLog = logLines.join('\n\n');

      console.log('⚡ High-Speed Extraction Completed perfectly. Packaging results for display.');
      res.json({ success: true, data: result });

    } catch (error: any) {
      console.error('Extraction Error:', error);
      
      let errorMessage = 'Server error during extraction';
      
      if (error && error.message) {
        if (error.message.includes('503') || error.message.includes('high demand') || error.message.includes('UNAVAILABLE')) {
          errorMessage = 'The AI system is currently experiencing high demand. Please try again in a few moments.';
        } else {
          try {
            const jsonMatch = error.message.match(/\{.*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed && parsed.error && parsed.error.message) {
                errorMessage = parsed.error.message;
              } else {
                errorMessage = error.message;
              }
            } else {
              errorMessage = error.message;
            }
          } catch (e) {
            errorMessage = error.message;
          }
        }
      }

      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // API Route for Indian Visa Application PDF extraction
  app.post('/api/extract-application-pdf', async (req, res) => {
    try {
      // Authenticate session via headers or request body
      const userId = (req.headers['x-user-id'] || req.body.userId)?.toString();
      if (!userId) {
        return res.status(200).json({ success: false, error: 'প্রবেশাধিকার পাননি। দয়া করে আগে লগইন করুন।' });
      }

      const users = getUsersStore();
      const user = users.find(u => u.id === userId);
      if (!user) {
        return res.status(200).json({ success: false, error: 'অবৈধ সেশন। দয়া করে আবার লগইন করুন।' });
      }

      if (user.isSuspended) {
        return res.status(200).json({ success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। দয়া করে এডমিনের সাথে যোগাযোগ করুন।' });
      }

      // Enforce 5-Passport/Application Daily Limit (reusing the same limit checker)
      const limitCheck = checkAndIncrementLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(200).json({ 
          success: false, 
          error: 'আপনার দৈনিক ফ্রী লিমিট (৫টি এক্সট্রাকশন) শেষ হয়ে গেছে। দয়া করে ২৪ ঘণ্টা পর আবার ফ্রী ট্রাই করতে পারবেন।' 
        });
      }

      appendAuditLog({ userId: userId, action: 'EXTRACTION', details: 'Extracted an Indian Visa Application PDF' });

      // Validate input request using Zod
      const parsedBody = ExtractApplicationPdfSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(200).json({ 
          success: false, 
          error: parsedBody.error.issues.map(e => e.message).join(', ') 
        });
      }

      let { pdfBase64, mimeType } = parsedBody.data;

      const clientApiKey = req.headers['x-api-key']?.toString() || process.env.GEMINI_API_KEY;

      if (!clientApiKey) {
        return res.status(200).json({ 
          success: false,
          error: 'GEMINI_API_KEY is missing. Please set it in your Render Dashboard Environment variables, OR configure it directly in the Extractor UI Settings (gear icon in the top-right of your screen).' 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: clientApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // We expect the frontend to send just the base64 string without the data URI prefix
      const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;

      console.log('⚡ High-Speed Visa Application PDF Extraction Pipeline Initiated.');

      const systemInstruction = `You are an ultra-fast, high-precision Application Extraction & Validation Agent specializing in Indian Visa Application PDFs submitted by Bangladeshi citizens.
The uploaded document is a PDF containing exactly 2 or 3 pages of the Indian Visa Application Form.

CRITICAL DISCIPLINE:
- Extract all data EXACTLY as printed in the uploaded form.
- DO NOT add or fabricate any external or extra (barti) information. 
- DO NOT invent synthetic addresses or rotate fake Dhaka addresses.
- If a value is present in the form, extract it exactly as it is. If a field or section (like Employer/Profession details or spouse name) is blank or not on the form, keep it empty or blank. Do NOT fill it with fake or placeholder data.
- MUST EXTRACT the exact business name and address if printed in the "Profession / Occupation Details of Applicant" section.
- MUST EXTRACT the exact private company name, designation, and address if present.
- MUST EXTRACT the exact hospital details (Name, Doctor, Address, etc.) if it is a Medical Visa application and the details are printed.
- MUST EXTRACT the exact hotel details if it is a Tourist Visa application and the details are printed.

CRITICAL INITIAL QUALITY SCAN:
Before doing any extraction, carefully evaluate the provided PDF file first.
- Is this actually an Indian Visa Application Form or a similar visa application?
- If the PDF is NOT a visa application, or if it is completely blank/unreadable, you MUST set "isValidApplication" to false, and provide a clear, detailed, helpful explanation in Bengali under "validationError" explaining exactly why it cannot be read.
- If the PDF is a valid, legible visa application, you MUST set "isValidApplication" to true and "validationError" to "".

INSTRUCTIONS FOR VALID APPLICATIONS:
1. OCR Extraction: Extract the following core properties from all pages (2 or 3 pages) of the PDF exactly as printed:
   - givenName: Applicant's Given Name
   - surname: Applicant's Surname (if blank, use empty string)
   - dob: Date of Birth. Extract and format strictly as DD/MM/YYYY (e.g., 15/08/1990)
   - birthPlace: Place of Birth
   - fatherName: Father's Name
   - motherName: Mother's Name
   - spouseName: Spouse's Name (if unmarried or empty, use empty string)
   - passportNumber: Passport Number
   - nidOrBirthCertNumber: National ID or Birth Registration Number
   - issueDate: Passport Date of Issue. Format strictly as DD/MM/YYYY
   - expiryDate: Passport Date of Expiry. Format strictly as DD/MM/YYYY
   - gender: Gender (Male/Female/Other)
   - permanentAddress: Permanent Address. Format strictly as written in the form, but make sure to clean or normalize any unnecessary prefix labels.
   - presentAddress: Exact Present Address printed on the application form.
   - mobileNumber: Applicant's Phone or Mobile Number as printed in the form.

2. Additional Details Processing: 
   - professionDetails: In the "Profession / Occupation Details of Applicant" section, extract the exact printed Employer/Business/Organization Name into "jobCompanyName", the designation into "jobRole", and the exact employer address into "officeAddressDhaka" or "officeAddressLocal". For private companies, extract the name, designation, and address exactly as printed. DO NOT invent fake company names or fake commercial addresses.
   - medicalDetails: If this is a medical visa, extract the hospital name into "hospitalName" and the hospital address/details into "hospitalAddress".
   - touristDetails: If this is a tourist visa or has hotel info, extract the hotel name into "hotelName" and the hotel address into "hotelAddress".

3. Security & Confidence: Match visual details and list any discrepancies found under discrepancies. Determine overall confidenceScore (0-100). Also estimate individual fieldConfidence scores (0-100) for every field in finalData based on document legibility.
4. Undertaking: Set customUndertakingDraft to a very short 1-sentence string (e.g., "Full verification of submitted application data completed.") to optimize processing speed.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          isValidApplication: { type: Type.BOOLEAN },
          validationError: { type: Type.STRING },
          finalData: {
            type: Type.OBJECT,
            properties: {
              givenName: { type: Type.STRING },
              surname: { type: Type.STRING },
              dob: { type: Type.STRING },
              birthPlace: { type: Type.STRING },
              fatherName: { type: Type.STRING },
              motherName: { type: Type.STRING },
              spouseName: { type: Type.STRING },
              passportNumber: { type: Type.STRING },
              nidOrBirthCertNumber: { type: Type.STRING },
              issueDate: { type: Type.STRING },
              expiryDate: { type: Type.STRING },
              gender: { type: Type.STRING },
              permanentAddress: { type: Type.STRING },
              presentAddress: { type: Type.STRING },
              mobileNumber: { type: Type.STRING },
              jobCompanyName: { type: Type.STRING },
              jobRole: { type: Type.STRING },
              officeAddressDhaka: { type: Type.STRING },
              officeAddressLocal: { type: Type.STRING },
              hospitalName: { type: Type.STRING },
              hospitalAddress: { type: Type.STRING },
              hotelName: { type: Type.STRING },
              hotelAddress: { type: Type.STRING }
            },
            required: [
              "givenName", "surname", "dob", "birthPlace", "fatherName", "motherName",
              "spouseName", "passportNumber", "nidOrBirthCertNumber", "issueDate", "expiryDate", "gender", "permanentAddress", "mobileNumber", "presentAddress"
            ]
          },
          fieldConfidence: {
            type: Type.OBJECT,
            properties: {
              givenName: { type: Type.INTEGER },
              surname: { type: Type.INTEGER },
              dob: { type: Type.INTEGER },
              birthPlace: { type: Type.INTEGER },
              fatherName: { type: Type.INTEGER },
              motherName: { type: Type.INTEGER },
              spouseName: { type: Type.INTEGER },
              passportNumber: { type: Type.INTEGER },
              nidOrBirthCertNumber: { type: Type.INTEGER },
              issueDate: { type: Type.INTEGER },
              expiryDate: { type: Type.INTEGER },
              gender: { type: Type.INTEGER },
              permanentAddress: { type: Type.INTEGER },
              presentAddress: { type: Type.INTEGER },
              mobileNumber: { type: Type.INTEGER }
            },
            required: [
              "givenName", "surname", "dob", "birthPlace", "fatherName", "motherName",
              "spouseName", "passportNumber", "nidOrBirthCertNumber", "issueDate", "expiryDate", "gender", "permanentAddress", "mobileNumber", "presentAddress"
            ]
          },
          discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidenceScore: { type: Type.INTEGER },
          customUndertakingDraft: { type: Type.STRING },
          generatedAddresses: {
            type: Type.OBJECT,
            properties: {
              presentAddress: { type: Type.STRING },
              businessAddressDhaka: { type: Type.STRING },
              businessAddressLocal: { type: Type.STRING },
              officeAddressDhaka: { type: Type.STRING },
              officeAddressLocal: { type: Type.STRING }
            },
            required: ["presentAddress", "businessAddressDhaka", "businessAddressLocal", "officeAddressDhaka", "officeAddressLocal"]
          }
        },
        required: ["isValidApplication", "validationError", "finalData", "fieldConfidence", "discrepancies", "confidenceScore", "customUndertakingDraft", "generatedAddresses"]
      };

      let pipelineResponse;
      try {
        console.log('⚡ Running primary engine: gemini-3.1-flash-lite (Target latency: 2-3s)');
        pipelineResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              }
            }
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema
          }
        });
      } catch (err: any) {
        console.warn('⚠️ Primary gemini-3.1-flash-lite engine error, attempting fast fallback (gemini-3.5-flash)...', err.message || err);
        pipelineResponse = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              }
            }
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema
          }
        });
      }

      if (!pipelineResponse.text) {
        throw new Error('Visa application PDF extraction failed to return response data.');
      }

      const pipelineData = JSON.parse(pipelineResponse.text);
      console.log('✅ High-Speed Application PDF Extraction Pipeline Completed.');

      // Validate visa application PDF
      if (pipelineData.isValidApplication === false) {
        console.warn('⚠️ Visa application validation failed:', pipelineData.validationError);
        decrementLimit(userId);
        return res.status(200).json({
          success: false,
          error: pipelineData.validationError || 'পিডিএফ ফাইলটি একটি বৈধ ইন্ডিয়ান ভিসা অ্যাপ্লিকেশন নয়। দয়া করে সঠিক পিডিএফ ফাইল আপলোড করুন।'
        });
      }

      const result = {
        ...pipelineData.finalData,
        fieldConfidence: pipelineData.fieldConfidence,
        discrepancyList: pipelineData.discrepancies,
        customUndertakingDraft: pipelineData.customUndertakingDraft || "",
        permanentAddress: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.finalData.permanentAddress)),
        presentAddress: cleanAddressPrefixes(pipelineData.generatedAddresses.presentAddress),
        businessAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressDhaka),
        businessAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressLocal)),
        officeAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressDhaka),
        officeAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressLocal)),
      };

      const logLines = [
        `⚡ **High-Speed Indian Visa Form PDF Engine**: Indian Visa application form successfully parsed directly in a single pass.`,
        `🔍 **Form Parser Specialist**: Extracted given names, passport details, dates, and familial information.`,
        `🛡️ **Security Check System**: Analyzed structure and computed overall confidence is **${pipelineData.confidenceScore}%**.`,
        `📍 **Address Synchronizer**: Automatically designed matching residence and professional address fields.`
      ];
      result.agentLog = logLines.join('\n\n');

      console.log('⚡ Visa PDF Extraction Completed perfectly. Packaging results for display.');
      res.json({ success: true, data: result });

    } catch (error: any) {
      console.error('Visa PDF Extraction Error:', error);
      
      let errorMessage = 'Server error during PDF extraction';
      
      if (error && error.message) {
        if (error.message.includes('503') || error.message.includes('high demand') || error.message.includes('UNAVAILABLE')) {
          errorMessage = 'The AI system is currently experiencing high demand. Please try again in a few moments.';
        } else {
          try {
            const jsonMatch = error.message.match(/\{.*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed && parsed.error && parsed.error.message) {
                errorMessage = parsed.error.message;
              } else {
                errorMessage = error.message;
              }
            } else {
              errorMessage = error.message;
            }
          } catch (e) {
            errorMessage = error.message;
          }
        }
      }

      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // Helper function to generate addresses based on permanentAddress using Gemini
  async function generateAddressesUsingGemini(ai: GoogleGenAI, permanentAddress: string) {
    if (!permanentAddress || permanentAddress.trim() === '') {
      return {
        permanentAddress: '',
        presentAddress: '',
        businessAddressDhaka: '',
        businessAddressLocal: '',
        officeAddressDhaka: '',
        officeAddressLocal: ''
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          text: `You are an expert Bangladeshi address generator.
Given the Bangladeshi permanent address below, classify it and generate other complete addresses strictly following these 3 rules:

Permanent Address to analyze: "${permanentAddress}"

Classify or decide based on these 3 categories:
Category 1: If the permanent address is inside DHAKA DISTRICT (e.g. Dhaka city areas, Uttara, Banani, Gulshan, Dhanmondi, Savar, Keraniganj, Dhamrai, Nawabganj, Dohar etc.):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be exactly equal to the permanentAddress.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random commercial/office addresses inside DHAKA CITY (e.g., Dhanmondi, Gulshan, Uttara, Mirpur, Motijheel, Badda, Malibagh, Mogbazar, etc.). They must be distinct from each other and randomly chosen.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local area, district, or town, but with different local descriptors). They must be distinct from each other. You MUST explicitly append the District name WITH 4-DIGIT POSTAL CODE (e.g., Kishoreganj-2370) to the end of these addresses.

Category 2: If the permanent address is inside DHAKA DIVISION but NOT Dhaka District (e.g., Gazipur, Narayanganj, Tangail, Faridpur, Manikganj, Munshiganj, Narsingdi, Madaripur, Gopalganj, Rajbari, Shariatpur, Kishoreganj):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY (distinct from permanentAddress).
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name with 4-digit postal code (e.g. "Faridpur-7800") to the end of these addresses.

Category 3: If the permanent address is OUTSIDE DHAKA DIVISION (e.g., Sylhet, Chittagong, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, or any district outside Dhaka division):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name with 4-digit postal code (e.g. "Sylhet-3100") to the end of these addresses.

CRITICAL ADDRESS FORMATTING & DIVERSITY MANDATES:
- DHAKA CITY ADDRESSES (presentAddress, businessAddressDhaka, officeAddressDhaka):
  * MUST strictly use the natural standard pattern: "House [Number], Road [Number], [Area Name], Dhaka-[Postcode]", or for Uttara: "House [Number], Road [Number], Sector [Number], Uttara, Dhaka-[Postcode]" or Mirpur: "House [Number], Road [Number], Block [Letter], Mirpur-[Number], Dhaka-[Postcode]".
  * DHAKA AREA RANDOM DIVERSITY MANDATE: You MUST randomly select different areas for each generated Dhaka address (presentAddress, businessAddressDhaka, officeAddressDhaka). Do NOT use the same area for all three, and do NOT repeatedly default to "Uttara" or "Banani". You MUST rotate and choose randomly from a wide list of areas like: Mirpur, Mohammadpur, Dhanmondi, Gulshan, Badda, Malibagh, Mogbazar, Khilgaon, Bashundhara, Rampura, Shanti Nagar, Wari, Lalbagh, Motijheel, Uttara, etc. For each generated address, pick a randomized area from this list. Do NOT use any hardcoded or fixed mapping between specific fields and specific areas. Ensure that presentAddress is randomly assigned any area from the list (for example, Mirpur, Mohammadpur, Badda, etc.) rather than always defaulting to Uttara.
  * Do NOT include office level/building tags (like "Level 8, Concord Tower" or "Plot 15, Block C") or wordy labels like "Banani Commercial Area". Keep them clean and directly of the standard format.
  * Areas like Banani, Gulshan, Dhanmondi, Uttara MUST have proper Road numbers (e.g., "House 15, Road 11, Banani, Dhaka-1213").
- LOCAL/RURAL ADDRESSES OUTSIDE DHAKA (businessAddressLocal, officeAddressLocal if permanentAddress is outside Dhaka):
  * Do NOT use Dhaka-style urban prefixes like "House/Holding/Plot/Block" or "Sector" for village/local areas, as it looks artificial and incorrect.
  * Do NOT append words like "Sadar", "Upazila", or other administrative clutter (e.g., write "Mithamain" instead of "Mithamain Sadar" or "Mithamain Upazila").
  * Do NOT include prefix labels or structural tags like 'Vill:', 'Post:', 'Thana:', 'Dist:', 'dist:', 'vill', 'post', 'thana', or 'dist'. Write clean comma-separated names of locations strictly following the 4-section format: "Goalpur, Mithamain, Goalpur-2370, Kishoreganj-2370" instead of "Vill: Goalpur, Thana: Mithamain, Post: Goalpur, Dist: Kishoreganj". Ensure the district name with 4-digit postal code is ALWAYS added as the last/4th section, and is never missing.
  * Keep it short, authentic, uncluttered, and highly natural. Do not use placeholders like "[Insert Road]".
- Return the output strictly in the requested JSON structure.`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            permanentAddress: { type: Type.STRING },
            presentAddress: { type: Type.STRING },
            businessAddressDhaka: { type: Type.STRING },
            businessAddressLocal: { type: Type.STRING },
            officeAddressDhaka: { type: Type.STRING },
            officeAddressLocal: { type: Type.STRING }
          },
          required: [
            "permanentAddress", "presentAddress", "businessAddressDhaka",
            "businessAddressLocal", "officeAddressDhaka", "officeAddressLocal"
          ]
        }
      }
    });

    if (response.text) {
      const rawObj = JSON.parse(response.text);
      return {
        permanentAddress: appendPostalCodeToAddress(cleanAddressPrefixes(rawObj.permanentAddress)),
        presentAddress: cleanAddressPrefixes(rawObj.presentAddress),
        businessAddressDhaka: cleanAddressPrefixes(rawObj.businessAddressDhaka),
        businessAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(rawObj.businessAddressLocal)),
        officeAddressDhaka: cleanAddressPrefixes(rawObj.officeAddressDhaka),
        officeAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(rawObj.officeAddressLocal))
      };
    }
    throw new Error('Failed to generate addresses using Gemini');
  }

  // API Route for address generation based on permanent address
  app.post('/api/generate-addresses', async (req, res) => {
    try {
      // Validate input request using Zod
      const parsedBody = GenerateAddressesSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
          success: false, 
          error: parsedBody.error.issues.map(e => e.message).join(', ') 
        });
      }

      const { permanentAddress } = parsedBody.data;
      const clientApiKey = req.headers['x-api-key']?.toString() || process.env.GEMINI_API_KEY;

      if (!clientApiKey) {
        return res.status(400).json({ 
          success: false,
          error: 'GEMINI_API_KEY is missing. Please configure it in your Settings.' 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: clientApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const addresses = await generateAddressesUsingGemini(ai, permanentAddress);
      res.json({ success: true, data: addresses });
    } catch (error: any) {
      console.error('Address Generation Error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to generate addresses' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
