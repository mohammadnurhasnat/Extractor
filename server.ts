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
  action: 'LOGIN' | 'EXTRACTION' | 'LIMIT_CHANGE' | 'USER_ADDED' | 'USER_EDITED' | 'USER_DELETED' | 'USER_SUSPENDED';
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

// Get dynamic users list, fallback to static USERS_DATABASE
function getUsersStore(): typeof USERS_DATABASE {
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

function saveUsersStore(users: typeof USERS_DATABASE) {
  try {
    // Write to TS file first so its mtime is updated
    syncUsersStoreToUsersTs(users);
    // Write to JSON store file second to ensure store mtime is newer when modified from front-end
    fs.writeFileSync(USERS_STORE_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing users store file:', error);
  }
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

const GenerateAddressesSchema = z.object({
  permanentAddress: z.string().min(1, 'Permanent address is required'),
});

async function startServer() {
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
  
  // API Route for passport extraction
  app.post('/api/extract-passport', async (req, res) => {
    try {
      // Authenticate session via headers or request body
      const userId = (req.headers['x-user-id'] || req.body.userId)?.toString();
      if (!userId) {
        return res.status(410).json({ success: false, error: 'প্রবেশাধিকার পাননি। দয়া করে আগে লগইন করুন।' });
      }

      const users = getUsersStore();
      const userExists = users.some(u => u.id === userId);
      if (!userExists) {
        return res.status(410).json({ success: false, error: 'অবৈধ সেশন। দয়া করে আবার লগইন করুন।' });
      }


      // Enforce 5-Passport Daily Limit
      const limitCheck = checkAndIncrementLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ 
          success: false, 
          error: 'আপনার দৈনিক ফ্রী লিমিট (৫টি এক্সট্রাকশন) শেষ হয়ে গেছে। দয়া করে ২৪ ঘণ্টা পর আবার ফ্রী ট্রাই করতে পারবেন।' 
        });
      }

      appendAuditLog({ userId: userId, action: 'EXTRACTION', details: 'Extracted a passport' });

      // Validate input request using Zod
      const parsedBody = ExtractPassportSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
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
        return res.status(400).json({ 
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
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      console.log('⚡ High-Speed Dual-Engine Extraction Pipeline Initiated.');

      const systemInstruction = `You are an ultra-fast, high-precision Passport Extraction & Validation Agent. 
Extract passport data, read and validate Machine-Readable Zone (MRZ) checksums, compute confidence scores, highlight structural discrepancies, and suggest Bangladeshi addresses.

INSTRUCTIONS:
1. OCR: Extract core properties: givenName, surname, dob, birthPlace, fatherName, motherName, spouseName, passportNumber, nidOrBirthCertNumber, issueDate, expiryDate, gender (Male/Female), permanentAddress, mobileNumber. Ensure permanentAddress captures the full address including the District name, which is usually at the bottom of the address block.
   - Core visual shapes: Carefully differentiate 'O' vs '0' and 'I' vs '1'.
   - IMPORTANT: Format dob, issueDate, and expiryDate strictly as DD/MM/YYYY (e.g. 15/08/1990).
2. MRZ: Read raw MRZ lines into rawMrz array. Populate validation fields (passportNumberChecksum, dobChecksum, expiryDateChecksum, compositeChecksum) with "Pass" or "Fail".
3. Security & Confidence: Match visual details with MRZ properties. List any discrepancies found under discrepancies. Determine overall confidenceScore (0-100). Also estimate individual fieldConfidence scores (0-100) for every field in finalData based on image legibility and MRZ cross-checks.
4. Undertaking: Set customUndertakingDraft to a very short 1-sentence string (e.g., "Full verification of passport data completed.") to optimize processing speed.
5. Address Rules: Base address structures on the permanentAddress classification:
   - Cat 1 (Inside Dhaka District): presentAddress is equal to permanentAddress. Create Dhaka commercial addresses for businessAddressDhaka, officeAddressDhaka. Create local versions for businessAddressLocal, officeAddressLocal.
   - Cat 2 (Dhaka Division, but not Dhaka District): Create a Dhaka City address for presentAddress, businessAddressDhaka, officeAddressDhaka. Create matching local addresses for local fields.
   - Cat 3 (Outside Dhaka Division): Create a Dhaka City address for presentAddress, businessAddressDhaka, officeAddressDhaka. Create matching local addresses for local fields.
   * Dhaka format: "House X, Road Y, [Area], Dhaka-[Postcode]" (No excessive building titles, commercial center tags, or complex names).
   * Rules for All addresses: Do NOT include prefix labels or structural tags like 'Vill:', 'Post:', 'Thana:', 'Dist:', 'dist:', 'vill', 'post', 'thana', or 'dist'. Write clean comma-separated names of locations e.g. "Mithamain, Mithamain, Kishoreganj-2370" instead of "Vill: Mithamain, Post: Mithamain, Dist: Kishoreganj-2370".`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
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
        required: ["finalData", "fieldConfidence", "mrzValidation", "discrepancies", "confidenceScore", "customUndertakingDraft", "generatedAddresses"]
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
        console.warn('⚠️ Primary gemini-3.1-flash-lite engine error, attempting fast fallback (gemini-flash-latest)...', err.message || err);
        pipelineResponse = await ai.models.generateContent({
          model: 'gemini-flash-latest',
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

      const result = {
        ...pipelineData.finalData,
        fieldConfidence: pipelineData.fieldConfidence,
        discrepancyList: pipelineData.discrepancies,
        customUndertakingDraft: pipelineData.customUndertakingDraft || "",
        permanentAddress: cleanAddressPrefixes(pipelineData.finalData.permanentAddress),
        presentAddress: cleanAddressPrefixes(pipelineData.generatedAddresses.presentAddress),
        businessAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressDhaka),
        businessAddressLocal: cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressLocal),
        officeAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressDhaka),
        officeAddressLocal: cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressLocal),
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

      res.status(500).json({ error: errorMessage });
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
      model: 'gemini-3.5-flash',
      contents: [
        {
          text: `You are an expert Bangladeshi address generator.
Given the Bangladeshi permanent address below, classify it and generate other complete addresses strictly following these 3 rules:

Permanent Address to analyze: "${permanentAddress}"

Classify or decide based on these 3 categories:
Category 1: If the permanent address is inside DHAKA DISTRICT (e.g. Dhaka city areas, Uttara, Banani, Gulshan, Dhanmondi, Savar, Keraniganj, Dhamrai, Nawabganj, Dohar etc.):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be exactly equal to the permanentAddress.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random commercial/office addresses inside DHAKA CITY (e.g., Banani, Gulshan, Dhanmondi, Uttara, Motijheel, Mirpur, etc.). They must be distinct from each other.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local area, district, or town, but with different local descriptors). They must be distinct from each other. You MUST explicitly append the District name to the end of these addresses.

Category 2: If the permanent address is inside DHAKA DIVISION but NOT Dhaka District (e.g., Gazipur, Narayanganj, Tangail, Faridpur, Manikganj, Munshiganj, Narsingdi, Madaripur, Gopalganj, Rajbari, Shariatpur, Kishoreganj):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY (distinct from permanentAddress).
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name (e.g. "Faridpur") to the end of these addresses.

Category 3: If the permanent address is OUTSIDE DHAKA DIVISION (e.g., Sylhet, Chittagong, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, or any district outside Dhaka division):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name (e.g. "Sylhet") to the end of these addresses.

CRITICAL ADDRESS FORMATTING MANDATES:
- DHAKA CITY ADDRESSES (presentAddress, businessAddressDhaka, officeAddressDhaka):
  * MUST strictly use the natural standard pattern: "House [Number], Road [Number], [Area Name], Dhaka-[Postcode]", or for Uttara: "House [Number], Road [Number], Sector [Number], Uttara, Dhaka-[Postcode]" or Mirpur: "House [Number], Road [Number], Block [Letter], Mirpur-[Number], Dhaka-[Postcode]".
  * Do NOT include office level/building tags (like "Level 8, Concord Tower" or "Plot 15, Block C") or wordy labels like "Banani Commercial Area". Keep them clean and directly of the standard format.
  * Areas like Banani, Gulshan, Dhanmondi, Uttara MUST have proper Road numbers (e.g., "House 15, Road 11, Banani, Dhaka-1213").
- LOCAL/RURAL ADDRESSES OUTSIDE DHAKA (businessAddressLocal, officeAddressLocal if permanentAddress is outside Dhaka):
  * Do NOT use Dhaka-style urban prefixes like "House/Holding/Plot/Block" or "Sector" for village/local areas, as it looks artificial and incorrect.
  * Do NOT append words like "Sadar", "Upazila", or other administrative clutter (e.g., write "Mithamain" instead of "Mithamain Sadar" or "Mithamain Upazila").
  * Do NOT include prefix labels or structural tags like 'Vill:', 'Post:', 'Thana:', 'Dist:', 'dist:', 'vill', 'post', 'thana', or 'dist'. Write clean comma-separated names of locations e.g. "Mithamain, Mithamain, Kishoreganj-2370" instead of "Vill: Mithamain, Post: Mithamain, Dist: Kishoreganj-2370" (Ensure the District name is ALWAYS included in these local addresses).
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
        permanentAddress: cleanAddressPrefixes(rawObj.permanentAddress),
        presentAddress: cleanAddressPrefixes(rawObj.presentAddress),
        businessAddressDhaka: cleanAddressPrefixes(rawObj.businessAddressDhaka),
        businessAddressLocal: cleanAddressPrefixes(rawObj.businessAddressLocal),
        officeAddressDhaka: cleanAddressPrefixes(rawObj.officeAddressDhaka),
        officeAddressLocal: cleanAddressPrefixes(rawObj.officeAddressLocal)
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
