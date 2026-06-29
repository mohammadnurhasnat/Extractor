import fs from 'fs';
import path from 'path';
import { User } from '../users';

export function updateUsersTsFile(users: User[]) {
  const usersTsPath = path.join(process.cwd(), 'src', 'users.ts');
  if (!fs.existsSync(usersTsPath)) return;
  
  let content = fs.readFileSync(usersTsPath, 'utf8');
  
  // Create JSON representation
  const serializedUsers = JSON.stringify(users, null, 4);
  
  // Find the array definition and replace it
  const regex = /export const USERS_DATABASE:\s*User\[\]\s*=\s*\[[\s\S]*?\];/;
  const newDeclaration = `export const USERS_DATABASE: User[] = ${serializedUsers};`;
  
  if (regex.test(content)) {
    content = content.replace(regex, newDeclaration);
    fs.writeFileSync(usersTsPath, content, 'utf8');
    console.log('✅ Successfully updated src/users.ts with new users.');
  } else {
    console.warn('⚠️ Could not find USERS_DATABASE in src/users.ts to update.');
  }
}
