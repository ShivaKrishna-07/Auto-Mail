import { db } from '../src/db/connection';
import { threads, emails } from '../src/db/schema';
import { desc, eq, like } from 'drizzle-orm';

async function main() {
  const ts = await db.query.threads.findMany({
    orderBy: [desc(threads.lastMessageDate)],
    limit: 5,
  });

  for (const t of ts) {
    if (t.subject?.includes('Testing broooo')) {
      console.log(`Thread: ${t.id} - ${t.subject}`);
      const threadEmails = await db.query.emails.findMany({
        where: eq(emails.threadId, t.id),
        orderBy: [emails.internalDate],
      });
      console.log(`Emails in thread: ${threadEmails.length}`);
      for (const e of threadEmails) {
        console.log(`  Email ${e.id} | From: ${e.sender} | Date: ${e.internalDate}`);
      }
    }
  }
  process.exit(0);
}

main().catch(console.error);
