import { Router } from 'express';
import { db } from './db';
import { users } from './schema';
import { getAuditLogs, appendAuditLog } from './db';
import { eq, or, ne, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const adminRouter = Router();

const settingsPath = path.join(process.cwd(), 'system-settings.json');

const getDefaultSettings = () => ({
  broadcastNotice: '',
  isNoticeActive: false,
  defaultDailyLimit: 5,
  maintenanceMode: false
});

const getSystemSettings = () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      return { ...getDefaultSettings(), ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading settings', err);
  }
  return getDefaultSettings();
};

const saveSystemSettings = (settings: any) => {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
};

adminRouter.get('/system-settings', (req, res) => {
  res.json({ success: true, settings: getSystemSettings() });
});

adminRouter.post('/system-settings', async (req, res) => {
  try {
    const adminId = req.headers['x-user-id']?.toString();
    if (!adminId) {
      return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
    }
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, adminId) });
    if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }
    
    const currentSettings = getSystemSettings();
    const newSettings = { ...currentSettings, ...req.body };
    saveSystemSettings(newSettings);
    
    res.json({ success: true, settings: newSettings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRouter.post('/admin/add-user', async (req, res) => {
  try {
    const adminId = req.headers['x-user-id']?.toString();
    if (!adminId) {
      return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, adminId) });
    if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
      return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat can add users.' });
    }

    const { name, email, mobileNumber, password } = req.body;
    if (!name || !mobileNumber || !password) {
      return res.status(400).json({ success: false, error: 'Name, Mobile Number, and Password are required fields.' });
    }

    const existingUser = await db.query.users.findFirst({
      where: or(
        eq(users.mobileNumber, mobileNumber),
        email ? eq(users.email, email.toLowerCase()) : undefined
      )
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'A user with this Email or Mobile Number already exists.' });
    }

    const newUserId = `user_${Date.now()}`;
    const newUser = {
      id: newUserId,
      name,
      email: email ? email.toLowerCase() : '',
      mobileNumber,
      password,
      dailyLimit: 5,
      isSuspended: false
    };

    await db.insert(users).values(newUser);
    await appendAuditLog({ userId: adminId, action: 'USER_ADDED', details: `Added new user ${newUser.id} (${newUser.email})` });

    res.json({ success: true, user: newUser });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to add user.' });
  }
});

adminRouter.post('/admin/update-user-limit', async (req, res) => {
  try {
    const adminId = req.headers['x-user-id']?.toString();
    if (!adminId) {
      return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, adminId) });
    if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
      return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat can update user limits.' });
    }

    const { userId, newLimit } = req.body;
    if (!userId || typeof newLimit !== 'number') {
      return res.status(400).json({ success: false, error: 'User ID and numeric limit are required.' });
    }

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    await db.update(users).set({ dailyLimit: newLimit }).where(eq(users.id, userId));
    await appendAuditLog({ userId: adminId, action: 'LIMIT_CHANGE', details: `Changed daily limit for user ${userId} to ${newLimit}` });

    res.json({ success: true, user: { ...targetUser, dailyLimit: newLimit } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update user limit.' });
  }
});

adminRouter.post('/admin/toggle-suspend', async (req, res) => {
  try {
    const adminId = req.headers['x-user-id']?.toString();
    if (!adminId) {
      return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, adminId) });
    if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
      return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat can suspend users.' });
    }

    const { userId, isSuspended } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (targetUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com') {
      return res.status(400).json({ success: false, error: 'Admin account cannot be suspended.' });
    }

    await db.update(users).set({ isSuspended: !!isSuspended }).where(eq(users.id, userId));
    await appendAuditLog({ userId: adminId, action: 'USER_SUSPENDED', details: `${isSuspended ? 'Suspended' : 'Unsuspended'} user ${userId}` });

    res.json({ success: true, user: { ...targetUser, isSuspended: !!isSuspended } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to toggle suspension.' });
  }
});

adminRouter.post('/admin/delete-user', async (req, res) => {
  try {
    const adminId = req.headers['x-user-id']?.toString();
    if (!adminId) {
      return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, adminId) });
    if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
      return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat can delete users.' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (targetUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com') {
      return res.status(400).json({ success: false, error: 'Admin account cannot be deleted.' });
    }

    await db.delete(users).where(eq(users.id, userId));
    await appendAuditLog({ userId: adminId, action: 'USER_DELETED', details: `Deleted user ${userId}` });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete user.' });
  }
});

adminRouter.post('/admin/edit-user', async (req, res) => {
  try {
    const adminId = req.headers['x-user-id']?.toString();
    if (!adminId) {
      return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, adminId) });
    if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
      return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat has access.' });
    }

    const { userId, name, email, mobileNumber, password, dailyLimit } = req.body;
    if (!userId || !name || !mobileNumber || !password) {
      return res.status(400).json({ success: false, error: 'User ID, Name, Mobile Number, and Password are required.' });
    }

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const conflictUser = await db.query.users.findFirst({
      where: and(
        ne(users.id, userId),
        or(
          eq(users.mobileNumber, mobileNumber),
          email ? eq(users.email, email.toLowerCase()) : undefined
        )
      )
    });

    if (conflictUser) {
      return res.status(400).json({ success: false, error: 'A different user with this Email or Mobile Number already exists.' });
    }

    const updateData: any = {
      name,
      email: email ? email.toLowerCase() : '',
      mobileNumber,
      password,
    };
    if (typeof dailyLimit === 'number') {
      updateData.dailyLimit = dailyLimit;
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));
    await appendAuditLog({ userId: adminId, action: 'USER_EDITED', details: `Edited details of user ${userId}` });

    res.json({ success: true, user: { ...targetUser, ...updateData } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to edit user.' });
  }
});

adminRouter.get('/admin/users', async (req, res) => {
  try {
    const adminId = req.headers['x-user-id']?.toString();
    if (!adminId) {
      return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, adminId) });
    if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
      return res.status(403).json({ success: false, error: 'Access denied. Only Mohammad Nur Hasnat has access.' });
    }

    const allUsers = await db.query.users.findMany();
    res.json({ success: true, users: allUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch users.' });
  }
});

adminRouter.get('/admin/audit-logs', async (req, res) => {
  try {
    const adminId = req.headers['x-user-id']?.toString();
    if (!adminId) {
      return res.status(403).json({ success: false, error: 'Access denied. Please log in.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, adminId) });
    if (!adminUser || adminUser.email.toLowerCase() !== 'mohammadnurhasnat@gmail.com') {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const logs = await getAuditLogs();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch audit logs.' });
  }
});
