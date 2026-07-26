import fs from 'fs';
import path from 'path';
import { db } from './server_modules/db';
import { users as usersSchema, history as historySchema, auditLogs as auditSchema, dailyLimits as limitSchema } from './server_modules/schema';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  console.log('Migrating data from local JSON to MySQL...');
  
  // Users
  if (fs.existsSync('users.json')) {
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    console.log(`Migrating ${users.length} users...`);
    for (const u of users) {
      try {
        await db.insert(usersSchema).values({
          id: u.id,
          name: u.name || '',
          email: u.email || '',
          mobileNumber: u.mobileNumber || '',
          password: u.password || '',
          isSuspended: u.isSuspended || false,
          dailyLimit: u.dailyLimit ?? 5,
        });
      } catch (e: any) {
         if (e.code !== 'ER_DUP_ENTRY') console.error(`Failed to migrate user ${u.id}`, e.message);
      }
    }
  }

  // History
  const historyDir = path.join(process.cwd(), 'user_data');
  if (fs.existsSync(historyDir)) {
    const files = fs.readdirSync(historyDir);
    for (const file of files) {
      if (file.endsWith('_history.json')) {
        const userId = file.replace('_history.json', '');
        const items = JSON.parse(fs.readFileSync(path.join(historyDir, file), 'utf8'));
        console.log(`Migrating ${items.length} history items for user ${userId}...`);
        
        for (const item of items) {
          try {
            await db.insert(historySchema).values({
              id: item.id,
              userId: userId,
              permanentAddress: item.permanentAddress,
              presentAddress: item.presentAddress,
              businessAddressDhaka: item.businessAddressDhaka,
              businessAddressLocal: item.businessAddressLocal,
              officeAddressDhaka: item.officeAddressDhaka,
              officeAddressLocal: item.officeAddressLocal,
              nidName: item.nidName,
              nidNumber: item.nidNumber,
              nidDob: item.nidDob,
            });
          } catch (e: any) {
            if (e.code !== 'ER_DUP_ENTRY') console.error(`Failed to migrate history item ${item.id}`, e.message);
          }
        }
      }
    }
  }

  console.log('Migration completed. You can delete the JSON files later.');
  process.exit(0);
}

migrate();
