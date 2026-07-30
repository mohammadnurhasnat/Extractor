import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema';
import { eq, desc, and } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

const defaultPgUrl = 'postgresql://neondb_owner:npg_rq6wGoD0PHNO@ep-cold-salad-axqbmz2g.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
const rawUrl = process.env.DATABASE_URL || '';
const dbUrl = (rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://')) ? rawUrl : defaultPgUrl;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

// Auto-migrate schema changes (e.g. adding missing columns/tables)
async function initDbTables() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "profilePicture" text;');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared_cards (
        id VARCHAR(255) PRIMARY KEY,
        "passportData" TEXT,
        "undertakingData" TEXT,
        "createdBy" VARCHAR(255),
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS broadcast_messages (
        id VARCHAR(255) PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('DB schema checked: profilePicture column & missing tables ensured.');
  } catch (err) {
    console.error('DB auto-migration error:', err);
  }
}
initDbTables();

export const db = drizzle(pool, { schema });


// We keep some synchronous behavior logic purely as types, but the actual functions will be async now.
export type User = typeof schema.users.$inferSelect;

export async function getUsersStore(): Promise<User[]> {
  try {
    return await db.select().from(schema.users);
  } catch (error) {
    console.error("Error fetching users from DB:", error);
    return [];
  }
}

export async function saveUsersStore(userObj: User | User[]) {
  // Instead of saving all users, we should insert/update. 
  // However, existing code calls saveUsersStore with the full array or mutates it.
  // It's better to update the routers, but if they pass an array, we can bulk upsert.
  // We'll throw an error here to force us to rewrite the routers properly.
  throw new Error("saveUsersStore is deprecated. Use direct Drizzle queries in routers.");
}

export async function appendAuditLog(log: { userId: string; action: string; details: string }) {
  try {
    await db.insert(schema.auditLogs).values({
      userId: log.userId,
      action: log.action,
      details: log.details,
    });
  } catch (error) {
    console.error("Error writing audit log:", error);
  }
}

export async function getAuditLogs() {
  try {
    return await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.timestamp)).limit(5000);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

export async function checkAndIncrementLimit(userId: string): Promise<{ allowed: boolean; remaining: number; count: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    const userLimit = user?.dailyLimit ?? 5;

    let limitRecord = await db.query.dailyLimits.findFirst({ where: eq(schema.dailyLimits.id, userId) });
    
    if (!limitRecord || limitRecord.date !== today) {
      if (limitRecord) {
        await db.update(schema.dailyLimits).set({ date: today, count: 0 }).where(eq(schema.dailyLimits.id, userId));
      } else {
        await db.insert(schema.dailyLimits).values({ id: userId, date: today, count: 0 });
      }
      limitRecord = { id: userId, date: today, count: 0 };
    }

    if (limitRecord.count >= userLimit) {
      return { allowed: false, remaining: 0, count: limitRecord.count };
    }

    const newCount = limitRecord.count + 1;
    await db.update(schema.dailyLimits).set({ count: newCount }).where(eq(schema.dailyLimits.id, userId));

    return { allowed: true, remaining: userLimit - newCount, count: newCount };
  } catch (error) {
    console.error("Error in checkAndIncrementLimit:", error);
    return { allowed: false, remaining: 0, count: 0 };
  }
}

export async function checkAndIncrementIPLimit(ip: string): Promise<{ allowed: boolean; count: number }> {
  if (!ip) return { allowed: true, count: 0 };
  try {
    const today = new Date().toISOString().split('T')[0];
    const ipKey = `ip_${ip}`;
    
    let limitRecord = await db.query.dailyLimits.findFirst({ where: eq(schema.dailyLimits.id, ipKey) });
    
    if (!limitRecord || limitRecord.date !== today) {
      if (limitRecord) {
        await db.update(schema.dailyLimits).set({ date: today, count: 0 }).where(eq(schema.dailyLimits.id, ipKey));
      } else {
        await db.insert(schema.dailyLimits).values({ id: ipKey, date: today, count: 0 });
      }
      limitRecord = { id: ipKey, date: today, count: 0 };
    }

    const IP_MAX_LIMIT = 10;
    if (limitRecord.count >= IP_MAX_LIMIT) {
      return { allowed: false, count: limitRecord.count };
    }
    
    const newCount = limitRecord.count + 1;
    await db.update(schema.dailyLimits).set({ count: newCount }).where(eq(schema.dailyLimits.id, ipKey));
    return { allowed: true, count: newCount };
  } catch (error) {
    console.error("Error in checkAndIncrementIPLimit:", error);
    return { allowed: true, count: 0 }; // Fail open for IP limit issues
  }
}

export async function decrementLimit(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const limitRecord = await db.query.dailyLimits.findFirst({ where: eq(schema.dailyLimits.id, userId) });
    if (limitRecord && limitRecord.date === today && limitRecord.count > 0) {
      await db.update(schema.dailyLimits).set({ count: limitRecord.count - 1 }).where(eq(schema.dailyLimits.id, userId));
    }
  } catch (error) {
    console.error("Error decrementing limit:", error);
  }
}

export async function getLimitStatus(userId: string): Promise<{ count: number; remaining: number; limit: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    const userLimit = user?.dailyLimit ?? 5;
    
    const limitRecord = await db.query.dailyLimits.findFirst({ where: eq(schema.dailyLimits.id, userId) });
    
    if (!limitRecord || limitRecord.date !== today) {
      return { count: 0, remaining: userLimit, limit: userLimit };
    }
    
    return { count: limitRecord.count, remaining: Math.max(0, userLimit - limitRecord.count), limit: userLimit };
  } catch (error) {
    console.error("Error getting limit status:", error);
    return { count: 0, remaining: 5, limit: 5 };
  }
}

export function getDb() {
  return db;
}

// Dummy export for server.ts that used to load firestore
export async function loadUsersFromFirestore() {
  console.log("MySQL connection initialized.");
}
