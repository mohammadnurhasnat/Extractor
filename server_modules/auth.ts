import { Router } from 'express';
import { db } from './db';
import { users } from './schema';
import { appendAuditLog } from './db';
import { eq, or } from 'drizzle-orm';

export const authRouter = Router();

// Helper to dynamically get cookie domain (resolves .extractor.fun etc.)
function getCookieDomain(req: any) {
  if (process.env.COOKIE_DOMAIN) {
    return process.env.COOKIE_DOMAIN;
  }
  const hostHeader = req.headers.host;
  if (!hostHeader) return undefined;
  
  const host = hostHeader.split(':')[0].toLowerCase();
  
  // If it's localhost or an IP, do not use domain attribute
  if (host === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return undefined;
  }
  
  // Specifically handle extractor.fun and its subdomains
  if (host.endsWith('extractor.fun')) {
    return '.extractor.fun';
  }
  
  // General domain parsing fallback (sub.example.com -> .example.com)
  const parts = host.split('.');
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join('.')}`;
  }
  return undefined;
}

// Helper to set SSO Shared Domain Cookie
function setSSOCookie(req: any, res: any, user: any) {
  const sessionData = {
    id: user.id,
    email: user.email,
    name: user.name,
    timestamp: Date.now()
  };
  const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  
  const cookieDomain = getCookieDomain(req);
  
  // Set cookie for parent domain so both extractor & padgen subdomains can access it
  const cookieOptions: any = {
    path: '/',
    httpOnly: false, // Must be false so frontend JS on subdomains can read the SSO state
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  if (cookieDomain) {
    cookieOptions.domain = cookieDomain;
  }

  res.cookie('sso_token', token, cookieOptions);
  return token;
}

authRouter.post('/google-login', async (req, res) => {
  try {
    const { email, name, id } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email missing.' });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });

    if (existingUser) {
      if (existingUser.isSuspended) {
        return res.status(403).json({ success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। Users have been suspended. Now, contact support.' });
      }
      await appendAuditLog({ userId: existingUser.id, action: 'LOGIN', details: 'Google Login successful' });
      const ssoToken = setSSOCookie(req, res, existingUser);
      return res.json({ success: true, user: existingUser, ssoToken });
    } else {
      const newUserId = id || `user_${Date.now()}`;
      const newUser = {
        id: newUserId,
        name: name || email.split('@')[0].toUpperCase(),
        email: email.toLowerCase(),
        mobileNumber: '',
        password: Math.random().toString(36).substring(2, 10),
        dailyLimit: 5,
        isSuspended: false
      };
      await db.insert(users).values(newUser);
      
      await appendAuditLog({ userId: newUserId, action: 'LOGIN', details: 'Google Login successful (first time)' });
      
      const ssoToken = setSSOCookie(req, res, newUser);
      return res.json({ success: true, user: newUser, ssoToken });
    }
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, error: 'Email/Mobile or Password missing.' });
    }

    const user = await db.query.users.findFirst({
      where: or(
        eq(users.email, loginIdentifier.toLowerCase()),
        eq(users.mobileNumber, loginIdentifier)
      )
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'ভুল ইমেইল/মোবাইল নাম্বার অথবা পাসওয়ার্ড দিয়েছেন।' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। Users have been suspended. Now, contact support.' });
    }
    
    await appendAuditLog({ userId: user.id, action: 'LOGIN', details: 'User logged in successfully' });
    const ssoToken = setSSOCookie(req, res, user);
    res.json({ success: true, user, ssoToken });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

authRouter.get('/sso/verify', async (req, res) => {
  try {
    const ssoToken = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sso_token;
    if (!ssoToken) {
      return res.status(401).json({ success: false, authenticated: false, error: 'No SSO token provided.' });
    }

    const decoded = JSON.parse(Buffer.from(ssoToken, 'base64').toString('utf-8'));
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, authenticated: false, error: 'Invalid token structure.' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id)
    });

    if (!user || user.isSuspended) {
      return res.status(403).json({ success: false, authenticated: false, error: 'User invalid or suspended.' });
    }

    res.json({ success: true, authenticated: true, user });
  } catch (error) {
    res.status(401).json({ success: false, authenticated: false, error: 'Authentication failed.' });
  }
});

authRouter.post('/sso/logout', (req, res) => {
  const cookieOptions: any = { path: '/' };
  const cookieDomain = getCookieDomain(req);
  if (cookieDomain) {
    cookieOptions.domain = cookieDomain;
  }
  res.clearCookie('sso_token', cookieOptions);
  res.json({ success: true, message: 'Logged out from SSO session.' });
});

authRouter.post('/log-action', async (req, res) => {
  try {
    const { userId, action, details } = req.body;
    if (!userId || !action) {
      return res.status(400).json({ success: false, error: 'User ID and action are required.' });
    }
    await appendAuditLog({ userId, action, details: details || '' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to log action.' });
  }
});

authRouter.post('/update-profile', async (req, res) => {
  try {
    const { userId, name, mobileNumber, password, profilePicture } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const updateFields: any = {};
    if (name !== undefined && name !== null && name.trim() !== '') {
      updateFields.name = name.trim();
    }
    if (mobileNumber !== undefined && mobileNumber !== null) {
      updateFields.mobileNumber = mobileNumber.trim();
    }
    if (password && password.trim() !== '') {
      updateFields.password = password.trim();
    }
    if (profilePicture !== undefined) {
      updateFields.profilePicture = profilePicture;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update.' });
    }

    await db.update(users).set(updateFields).where(eq(users.id, userId));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    await appendAuditLog({
      userId,
      action: 'UPDATE_PROFILE',
      details: 'Updated profile information (Name, Mobile, Password, or Photo)'
    });

    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update profile.' });
  }
});
