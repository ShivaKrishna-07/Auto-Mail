import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../db/connection';
import { threads as threadsTable, emails as emailsTable } from '../db/schema';
import { eq, and, desc, inArray, sql, isNull } from 'drizzle-orm';
import { aiService } from '../services/ai.service';
import { gmailService } from '../services/gmail.service';

class EmailController {
  async getThreads(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const category = req.query.category as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    try {
      let threadsList = [];
      let total = 0;

      if (category) {
        // Find email threadIds for this user and category
        const matchingEmails = await db.select({ threadId: emailsTable.threadId })
          .from(emailsTable)
          .where(and(eq(emailsTable.userId, userId), eq(emailsTable.category, category)));
          
        const threadIds = Array.from(new Set(matchingEmails.map(e => e.threadId)));
        
        if (threadIds.length === 0) {
          return res.json({ data: [], total: 0, page, limit });
        }

        const totalRes = await db.select({ count: sql<number>`count(*)` })
          .from(threadsTable)
          .where(and(
            eq(threadsTable.userId, userId),
            inArray(threadsTable.id, threadIds),
            sql`exists (select 1 from emails where emails.thread_id = threads.id and emails.label_ids::text like '%INBOX%')`
          ));
        total = Number(totalRes[0].count);

        threadsList = await db.query.threads.findMany({
          where: and(
            eq(threadsTable.userId, userId),
            inArray(threadsTable.id, threadIds),
            sql`exists (select 1 from emails where emails.thread_id = threads.id and emails.label_ids::text like '%INBOX%')`
          ),
          orderBy: [desc(threadsTable.lastMessageDate)],
          limit,
          offset,
        });
      } else {
        const totalRes = await db.select({ count: sql<number>`count(*)` })
          .from(threadsTable)
          .where(and(
            eq(threadsTable.userId, userId),
            sql`exists (select 1 from emails where emails.thread_id = threads.id and emails.label_ids::text like '%INBOX%')`
          ));
        total = Number(totalRes[0].count);

        threadsList = await db.query.threads.findMany({
          where: and(
            eq(threadsTable.userId, userId),
            sql`exists (select 1 from emails where emails.thread_id = threads.id and emails.label_ids::text like '%INBOX%')`
          ),
          orderBy: [desc(threadsTable.lastMessageDate)],
          limit,
          offset,
        });
      }

      return res.json({ data: threadsList, total, page, limit });
    } catch (error: any) {
      console.error('Error fetching threads:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch threads.' });
    }
  }

  async getThreadDetails(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { threadId } = req.params;

    try {
      const thread = await db.query.threads.findFirst({
        where: and(eq(threadsTable.id, threadId), eq(threadsTable.userId, userId)),
      });

      if (!thread) {
        return res.status(404).json({ error: 'Thread not found.' });
      }

      const emails = await db.query.emails.findMany({
        where: and(eq(emailsTable.threadId, threadId), eq(emailsTable.userId, userId)),
        orderBy: [emailsTable.internalDate],
      });

      return res.json({
        thread,
        emails,
      });
    } catch (error: any) {
      console.error('Error fetching thread details:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch thread details.' });
    }
  }

  async generateAIDraft(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { type, prompt, threadId, context } = req.body;

    try {
      if (type === 'new') {
        const draft = await aiService.draftEmail(prompt, context || '');
        return res.json({ draft });
      } else if (type === 'reply') {
        if (!threadId) {
          return res.status(400).json({ error: 'Thread ID is required for replies.' });
        }

        const thread = await db.query.threads.findFirst({
          where: and(eq(threadsTable.id, threadId), eq(threadsTable.userId, userId)),
        });

        const threadEmails = await db.query.emails.findMany({
          where: and(eq(emailsTable.threadId, threadId), eq(emailsTable.userId, userId)),
          orderBy: [desc(emailsTable.internalDate)],
        });

        if (threadEmails.length === 0) {
          return res.status(404).json({ error: 'No emails found for thread.' });
        }

        const lastEmail = threadEmails[0];
        const draft = await aiService.draftReply(
          thread?.summary || lastEmail.summary || 'No summary available.',
          lastEmail.body || '',
          prompt
        );

        return res.json({ draft });
      } else {
        return res.status(400).json({ error: 'Invalid draft type.' });
      }
    } catch (error: any) {
      console.error('Error generating AI draft:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate draft.' });
    }
  }

  async sendNewEmail(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Fields (to, subject, body) are required.' });
    }

    try {
      const result = await gmailService.sendEmail(userId, to, subject, body);
      return res.json({ success: true, result });
    } catch (error: any) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: error.message || 'Failed to send email.' });
    }
  }

  async sendReply(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { threadId, body } = req.body;

    if (!threadId || !body) {
      return res.status(400).json({ error: 'Fields (threadId, body) are required.' });
    }

    try {
      const result = await gmailService.replyToThread(userId, threadId, body);
      
      // Asynchronously trigger sync to capture the reply message
      gmailService.syncEmails(userId, 5).catch(err => console.error('Post-reply sync error:', err));

      return res.json({ success: true, result });
    } catch (error: any) {
      console.error('Error sending reply:', error);
      return res.status(500).json({ error: error.message || 'Failed to send reply.' });
    }
  }

  async summarizeThread(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { threadId } = req.params;

    try {
      const threadEmails = await db.query.emails.findMany({
        where: and(eq(emailsTable.threadId, threadId), eq(emailsTable.userId, userId)),
        orderBy: [emailsTable.internalDate],
      });

      if (threadEmails.length === 0) {
        return res.status(404).json({ error: 'Thread not found.' });
      }

      const formattedEmails = threadEmails.map(e => ({
        sender: e.sender,
        internalDate: e.internalDate,
        body: e.body || '',
      }));

      const summary = await aiService.summarizeThread(formattedEmails);

      await db.update(threadsTable).set({
        summary,
        updatedAt: new Date(),
      }).where(eq(threadsTable.id, threadId));

      return res.json({ summary });
    } catch (error: any) {
      console.error('Error summarizing thread:', error);
      return res.status(500).json({ error: error.message || 'Failed to summarize thread.' });
    }
  }

  async categorizeThread(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { threadId } = req.params;

    try {
      const threadEmails = await db.query.emails.findMany({
        where: and(eq(emailsTable.threadId, threadId), eq(emailsTable.userId, userId)),
        orderBy: [desc(emailsTable.internalDate)],
      });

      if (threadEmails.length === 0) {
        return res.status(404).json({ error: 'Thread not found.' });
      }

      // We categorize based on the latest email in the thread
      const latestEmail = threadEmails[0];
      const category = await aiService.categorizeEmail(latestEmail.subject || '', latestEmail.body || '');

      await db.update(emailsTable).set({
        category,
        isNewsletter: category === 'Newsletter',
      }).where(eq(emailsTable.threadId, threadId));

      return res.json({ category });
    } catch (error: any) {
      console.error('Error categorizing thread:', error);
      return res.status(500).json({ error: error.message || 'Failed to categorize thread.' });
    }
  }

  async getUncategorizedCount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

      const result = await db.select({ count: sql<number>`count(*)` })
        .from(emailsTable)
        .where(and(eq(emailsTable.userId, userId), isNull(emailsTable.category)));
      
      return res.json({ count: Number(result[0].count) });
    } catch (error: any) {
      console.error('Get uncategorized count error:', error);
      return res.status(500).json({ error: 'Failed to get count' });
    }
  }

  async categorizeAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
      
      // Find all emails for this user where category is null
      const uncategorized = await db.query.emails.findMany({
        where: and(eq(emailsTable.userId, userId), isNull(emailsTable.category)),
        limit: 50 
      });

      if (uncategorized.length === 0) {
        return res.json({ categorizedCount: 0 });
      }

      let count = 0;
      for (const email of uncategorized) {
        try {
          const category = await aiService.categorizeEmail(email.subject || '', email.body || '');
          await db.update(emailsTable)
            .set({ category, isNewsletter: category === 'Newsletter' })
            .where(eq(emailsTable.id, email.id));
          count++;
        } catch (err: any) {
          if (err.message?.includes('quota') || err.message?.includes('rate limit')) {
            console.warn('Hit AI quota while categorizing batch. Stopping early.');
            break;
          }
          console.error(`Failed to categorize email ${email.id}:`, err);
        }
      }

      return res.json({ categorizedCount: count });
    } catch (error: any) {
      console.error('Categorize all error:', error);
      return res.status(500).json({ error: 'Failed to categorize all emails' });
    }
  }
}

export const emailController = new EmailController();
