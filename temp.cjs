const fs = require('fs');
let code = fs.readFileSync('server_modules/extraction.ts', 'utf8');

// I will clean up the duplicate imports.
code = code.replace(/(import \{ db \} from '\.\/db';\nimport \{ users \} from '\.\/schema';\nimport \{ eq \} from 'drizzle-orm';\n)/g, '');

code = `import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
` + code;

code = code.replace(/const users = getUsersStore\(\);\s*const user = users\.find\(u => u\.id === userId\);/g, 'const user = await db.query.users.findFirst({ where: eq(users.id, userId) });');

fs.writeFileSync('server_modules/extraction.ts', code);
