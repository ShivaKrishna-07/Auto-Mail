import { db } from '../src/db/connection';
import { users } from '../src/db/schema';
import { gmailService } from '../src/services/gmail.service';

async function main() {
  const allUsers = await db.query.users.findMany();
  if (allUsers.length === 0) {
    console.log('No users found.');
    process.exit(0);
  }

  const userId = allUsers[0].id;
  console.log(`Syncing for user ${userId}...`);
  try {
    const result = await gmailService.syncEmails(userId, 10);
    console.log('Sync result:', result);
  } catch (error) {
    console.error('Sync failed:', error);
  }
  process.exit(0);
}

main().catch(console.error);
