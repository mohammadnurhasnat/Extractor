import { Router } from 'express';
import { getUsersStore, saveUsersStore, appendAuditLog } from './db';

export const authRouter = Router();

authRouter.post('/google-login', (req, res) => {
  try {
    const { email, name, id } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email missing.' });
    }

    const users = getUsersStore();
    const existingUser = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      if (existingUser.isSuspended) {
        return res.status(403).json({ success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। Users have been suspended. Now, contact support.' });
      }
      appendAuditLog({ userId: existingUser.id, action: 'LOGIN', details: 'Google Login successful' });
      return res.json({ success: true, user: existingUser });
    } else {
      const newUserId = id || `user_${Date.now()}`;
      const newUser = {
        id: newUserId,
        name: name || email.split('@')[0].toUpperCase(),
        email: email,
        mobileNumber: '',
        password: Math.random().toString(36).substring(2, 10),
        dailyLimit: 5
      };

      users.push(newUser);
      saveUsersStore(users);
      
      appendAuditLog({ userId: newUserId, action: 'USER_ADDED', details: `New user registered via Google: ${newUserId}` });
      appendAuditLog({ userId: newUserId, action: 'LOGIN', details: 'Google Login successful (first time)' });
      
      return res.json({ success: true, user: newUser });
    }
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

authRouter.post('/login', (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, error: 'Email/Mobile or Password missing.' });
    }

    const users = getUsersStore();
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
    
    appendAuditLog({ userId: user.id, action: 'LOGIN', details: 'User logged in successfully' });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

authRouter.post('/log-action', (req, res) => {
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
