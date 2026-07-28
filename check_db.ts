import { db } from './server_modules/db';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  console.log("Checking DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not Set");
  try {
    const result = await db.execute(sql`SELECT 1 as connected`);
    console.log("Connection successful!", result);
    process.exit(0);
  } catch (error: any) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }
}
check();
