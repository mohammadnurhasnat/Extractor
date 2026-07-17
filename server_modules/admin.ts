import { Router } from 'express';
import { getUsersStore, saveUsersStore, appendAuditLog, getAuditLogs } from './db';

export const adminRouter = Router();

adminRouter.get('/admin/users', (req, res) => {
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

adminRouter.post('/admin/add-user', async (req, res) => {
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

    const identifierExists = users.some(u => 
      u.mobileNumber === mobileNumber || 
      (email && u.email.toLowerCase() === email.toLowerCase())
    );
    if (identifierExists) {
      return res.status(400).json({ success: false, error: 'A user with this Email or Mobile Number already exists.' });
    }

    const newUserId = `user_${Date.now()}`;
    const newUser = {
      id: newUserId,
      name,
      email: email || '',
      mobileNumber,
      password,
      dailyLimit: 5
    };

    users.push(newUser);
    saveUsersStore(users);
    
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

    users[targetUserIndex].dailyLimit = newLimit;
    saveUsersStore(users);
    
    await appendAuditLog({ userId: adminId, action: 'LIMIT_CHANGE', details: `Changed daily limit for user ${userId} to ${newLimit}` });

    res.json({ success: true, user: users[targetUserIndex] });
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

    if (users[targetUserIndex].email.toLowerCase() === 'mohammadnurhasnat@gmail.com') {
      return res.status(400).json({ success: false, error: 'Admin account cannot be suspended.' });
    }

    users[targetUserIndex].isSuspended = !!isSuspended;
    saveUsersStore(users);
    
    await appendAuditLog({ userId: adminId, action: 'USER_SUSPENDED', details: `${isSuspended ? 'Suspended' : 'Unsuspended'} user ${userId}` });

    res.json({ success: true, user: users[targetUserIndex] });
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

    if (users[targetUserIndex].email.toLowerCase() === 'mohammadnurhasnat@gmail.com') {
      return res.status(400).json({ success: false, error: 'Admin account cannot be deleted.' });
    }

    users.splice(targetUserIndex, 1);
    saveUsersStore(users);
    
    await appendAuditLog({ userId: adminId, action: 'USER_DELETED', details: `Deleted user ${userId}` });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete user.' });
  }
});

adminRouter.post('/admin/edit-user', (req, res) => {
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

    const conflictExists = users.some((u, idx) => 
      idx !== targetUserIndex && 
      (u.mobileNumber === mobileNumber || (email && u.email && u.email.toLowerCase() === email.toLowerCase()))
    );
    if (conflictExists) {
      return res.status(400).json({ success: false, error: 'A different user with this Email or Mobile Number already exists.' });
    }

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

adminRouter.get('/admin/audit-logs', async (req, res) => {
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

    const logs = await getAuditLogs();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch audit logs.' });
  }
});
