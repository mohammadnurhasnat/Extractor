import { Router } from 'express';
import { db } from './db';
import { users, history as historySchema, sharedCards } from './schema';
import { eq, and, desc } from 'drizzle-orm';
import { appendAuditLog } from './db';
import { broadcastDbEvent } from './events';

export const historyRouter = Router();


historyRouter.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId?.toString();
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const requesterId = req.headers['x-user-id']?.toString();
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, requesterId) });
    const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
    
    if (requesterId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const historyItems = await db.select().from(historySchema).where(eq(historySchema.userId, userId)).orderBy(desc(historySchema.timestamp));
    
    const parsedHistory = historyItems.map((hItem: any) => {
      let itemData = {};
      if (hItem.data) {
        try {
          itemData = JSON.parse(hItem.data);
        } catch (e) {
          console.error("Failed to parse history JSON data for item:", hItem.id, e);
        }
      } else {
        // Fallback to separate fields if stored historically
        itemData = {
          permanentAddress: hItem.permanentAddress,
          presentAddress: hItem.presentAddress,
          businessAddressDhaka: hItem.businessAddressDhaka,
          businessAddressLocal: hItem.businessAddressLocal,
          officeAddressDhaka: hItem.officeAddressDhaka,
          officeAddressLocal: hItem.officeAddressLocal,
          nidName: hItem.nidName,
          nidNumber: hItem.nidNumber,
          nidDob: hItem.nidDob,
        };
      }
      return {
        ...hItem,
        data: itemData
      };
    });
    
    return res.json({ success: true, history: parsedHistory });
  } catch (error: any) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch history.' });
  }
});

historyRouter.post('/history', async (req, res) => {
  try {
    const { userId, item } = req.body;
    if (!userId || !item || !item.id) {
      return res.status(400).json({ success: false, error: 'User ID and history item with ID are required.' });
    }

    const requesterId = req.headers['x-user-id']?.toString();
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, requesterId) });
    const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
    
    if (requesterId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const itemTimestamp = item.timestamp ? new Date(item.timestamp) : new Date();

    await db.insert(historySchema).values({
      id: item.id,
      userId: userId,
      permanentAddress: item.data?.permanentAddress || item.permanentAddress || null,
      presentAddress: item.data?.presentAddress || item.presentAddress || null,
      businessAddressDhaka: item.data?.businessAddressDhaka || item.businessAddressDhaka || null,
      businessAddressLocal: item.data?.businessAddressLocal || item.businessAddressLocal || null,
      officeAddressDhaka: item.data?.officeAddressDhaka || item.officeAddressDhaka || null,
      officeAddressLocal: item.data?.officeAddressLocal || item.officeAddressLocal || null,
      nidName: item.data?.nidName || item.nidName || null,
      nidNumber: item.data?.nidNumber || item.nidNumber || null,
      nidDob: item.data?.nidDob || item.nidDob || null,
      data: item.data ? JSON.stringify(item.data) : null,
      timestamp: itemTimestamp,
    }).onConflictDoUpdate({
      target: historySchema.id,
      set: {
        data: item.data ? JSON.stringify(item.data) : null,
        timestamp: itemTimestamp,
        permanentAddress: item.data?.permanentAddress || item.permanentAddress || null,
        presentAddress: item.data?.presentAddress || item.presentAddress || null,
        businessAddressDhaka: item.data?.businessAddressDhaka || item.businessAddressDhaka || null,
        businessAddressLocal: item.data?.businessAddressLocal || item.businessAddressLocal || null,
        officeAddressDhaka: item.data?.officeAddressDhaka || item.officeAddressDhaka || null,
        officeAddressLocal: item.data?.officeAddressLocal || item.officeAddressLocal || null,
        nidName: item.data?.nidName || item.nidName || null,
        nidNumber: item.data?.nidNumber || item.nidNumber || null,
        nidDob: item.data?.nidDob || item.nidDob || null,
      }
    });

    await appendAuditLog({ 
      userId, 
      action: 'EXTRACTION', 
      details: `Saved extraction profile ${item.data?.givenName || ''} (${item.data?.passportNumber || item.id})` 
    });

    broadcastDbEvent({ type: 'DATA_UPDATED' });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save history:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save history.' });
  }
});

historyRouter.post('/history/bulk', async (req, res) => {
  try {
    const { userId, items } = req.body;
    if (!userId || !items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'User ID and items array are required.' });
    }

    const requesterId = req.headers['x-user-id']?.toString();
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, requesterId) });
    const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
    
    if (requesterId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    if (items.length > 0) {
      const formattedItems = items.map(item => ({
        id: item.id,
        userId: userId,
        permanentAddress: item.data?.permanentAddress || item.permanentAddress || null,
        presentAddress: item.data?.presentAddress || item.presentAddress || null,
        businessAddressDhaka: item.data?.businessAddressDhaka || item.businessAddressDhaka || null,
        businessAddressLocal: item.data?.businessAddressLocal || item.businessAddressLocal || null,
        officeAddressDhaka: item.data?.officeAddressDhaka || item.officeAddressDhaka || null,
        officeAddressLocal: item.data?.officeAddressLocal || item.officeAddressLocal || null,
        nidName: item.data?.nidName || item.nidName || null,
        nidNumber: item.data?.nidNumber || item.nidNumber || null,
        nidDob: item.data?.nidDob || item.nidDob || null,
        data: item.data ? JSON.stringify(item.data) : null,
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      }));
      
      // Batch insert logic is typically .insert(schema).values(array) in Drizzle
      await db.insert(historySchema).values(formattedItems).onConflictDoNothing();
      broadcastDbEvent({ type: 'DATA_UPDATED' });
    }
    
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save bulk history:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save bulk history.' });
  }
});

historyRouter.delete('/history/:id', async (req, res) => {
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
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, requesterId) });
    const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
    
    if (requesterId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    await db.delete(historySchema).where(and(eq(historySchema.id, id), eq(historySchema.userId, userId)));
    broadcastDbEvent({ type: 'DATA_UPDATED' });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete history item:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete history item.' });
  }
});

historyRouter.post('/history/clear', async (req, res) => {
  try {
    const userId = req.query.userId?.toString();
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    const requesterId = req.headers['x-user-id']?.toString();
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    
    const adminUser = await db.query.users.findFirst({ where: eq(users.id, requesterId) });
    const isAdmin = adminUser && adminUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';
    
    if (requesterId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    await db.delete(historySchema).where(eq(historySchema.userId, userId));
    broadcastDbEvent({ type: 'DATA_UPDATED' });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to clear history:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to clear history.' });
  }
});

historyRouter.post('/history/log-download', async (req, res) => {
  try {
    const { userId, type } = req.body;
    if (!userId || !['pad-pdf', 'card-pdf'].includes(type)) {
      return res.status(400).json({ success: false, error: 'User ID and valid download type are required.' });
    }

    const requesterId = req.headers['x-user-id']?.toString();
    if (!requesterId || requesterId !== userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const action = type === 'pad-pdf' ? 'PAD_DOWNLOAD' : 'CARD_DOWNLOAD';
    await appendAuditLog({ 
      userId, 
      action, 
      details: `${type === 'pad-pdf' ? 'Downloaded Business Pad PDF' : 'Downloaded Visiting Card PDF'}` 
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to log download:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to log download.' });
  }
});

historyRouter.post('/share-card', async (req, res) => {
  try {
    const { passportData, undertakingData, createdBy } = req.body;
    const shareId = 'share_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    await db.insert(sharedCards).values({
      id: shareId,
      passportData: passportData ? JSON.stringify(passportData) : null,
      undertakingData: undertakingData ? JSON.stringify(undertakingData) : null,
      createdBy: createdBy || 'anonymous',
    });

    res.json({ success: true, id: shareId });
  } catch (error: any) {
    console.error('Share card error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to share card.' });
  }
});

historyRouter.get('/share-card/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const card = await db.query.sharedCards.findFirst({ where: eq(sharedCards.id, id) });
    if (!card) {
      return res.status(404).json({ success: false, error: 'Shared card not found.' });
    }

    res.json({
      success: true,
      card: {
        id: card.id,
        passportData: card.passportData ? JSON.parse(card.passportData) : null,
        undertakingData: card.undertakingData ? JSON.parse(card.undertakingData) : null,
        createdBy: card.createdBy,
        timestamp: card.timestamp
      }
    });
  } catch (error: any) {
    console.error('Get shared card error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch shared card.' });
  }
});

