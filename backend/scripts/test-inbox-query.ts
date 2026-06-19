import { db } from '../src/db/connection';
import { threads, users } from '../src/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

async function main() {
  const allUsers = await db.query.users.findMany();
  if (allUsers.length === 0) return;
  const userId = allUsers[0].id;

  const totalRes = await db.select({ count: sql<number>`count(*)` })
    .from(threads)
    .where(and(
      eq(threads.userId, userId),
      sql`exists (select 1 from emails where emails.thread_id = threads.id and emails.label_ids::text like '%INBOX%')`
    ));
  
  console.log('Total INBOX threads:', totalRes[0].count);

  const threadsList = await db.query.threads.findMany({
    where: and(
      eq(threads.userId, userId),
      sql`exists (select 1 from emails where emails.thread_id = threads.id and emails.label_ids::text like '%INBOX%')`
    ),
    orderBy: [desc(threads.lastMessageDate)],
    limit: 5,
  });

  console.log(threadsList.map(t => t.subject));
  process.exit(0);
}

main().catch(console.error);
