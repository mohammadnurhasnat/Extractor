import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_rq6wGoD0PHNO@ep-cold-salad-axqbmz2g.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

export default defineConfig({
  schema: './server_modules/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
});

