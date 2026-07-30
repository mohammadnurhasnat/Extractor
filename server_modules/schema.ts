import { pgTable, varchar, integer, boolean, timestamp, text, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  mobileNumber: varchar('mobileNumber', { length: 20 }),
  password: varchar('password', { length: 255 }).notNull(),
  isSuspended: boolean('isSuspended').default(false),
  dailyLimit: integer('dailyLimit').default(5),
  profilePicture: text('profilePicture'),
  createdAt: timestamp('createdAt').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: varchar('userId', { length: 255 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const dailyLimits = pgTable('daily_limits', {
  id: varchar('id', { length: 255 }).primaryKey(), // e.g., userId or "ip_192.168.1.1"
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  count: integer('count').default(0),
});

export const history = pgTable('history', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('userId', { length: 255 }).notNull(),
  permanentAddress: text('permanentAddress'),
  presentAddress: text('presentAddress'),
  businessAddressDhaka: text('businessAddressDhaka'),
  businessAddressLocal: text('businessAddressLocal'),
  officeAddressDhaka: text('officeAddressDhaka'),
  officeAddressLocal: text('officeAddressLocal'),
  nidName: varchar('nidName', { length: 255 }),
  nidNumber: varchar('nidNumber', { length: 255 }),
  nidDob: varchar('nidDob', { length: 255 }),
  data: text('data'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const sharedCards = pgTable('shared_cards', {
  id: varchar('id', { length: 255 }).primaryKey(),
  passportData: text('passportData'),
  undertakingData: text('undertakingData'),
  createdBy: varchar('createdBy', { length: 255 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const broadcastMessages = pgTable('broadcast_messages', {
  id: varchar('id', { length: 255 }).primaryKey(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).default('info'),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt').defaultNow(),
});

