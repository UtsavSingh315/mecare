import { db } from './lib/db/index.js';
import { users } from './lib/db/schema.js';

async function checkUsers() {
  try {
    const existingUsers = await db.select().from(users).limit(5);
    console.log('Existing users:');
    existingUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - created: ${user.createdAt}`);
    });
    
    if (existingUsers.length === 0) {
      console.log('No users found in database.');
    }
  } catch (error) {
    console.error('Error checking users:', error);
  }
  process.exit(0);
}

checkUsers();
