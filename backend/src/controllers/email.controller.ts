import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../db/connection';
import { threads as threadsTable, emails as emailsTable } from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { aiService } from '../services/ai.service';
import { gmailService } from '../services/gmail.service';

class EmailController {
  async getThreads(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const category = req.query.category as string | undefined;

    try {
      let threadsList = [];

      if (category) {
        // Find email threadIds for this user and category
        const matchingEmails = await db.select({ threadId: emailsTable.threadId })
          .from(emailsTable)
          .where(and(eq(emailsTable.userId, userId), eq(emailsTable.category, category)));
          
        const threadIds = Array.from(new Set(matchingEmails.map(e => e.threadId)));
        
        if (threadIds.length === 0) {
          return res.json([]);
        }

        threadsList = await db.query.threads.findMany({
          where: and(eq(threadsTable.userId, userId), inArray(threadsTable.id, threadIds)),
          orderBy: [desc(threadsTable.lastMessageDate)],
        });
      } else {
        threadsList = await db.query.threads.findMany({
          where: eq(threadsTable.userId, userId),
          orderBy: [desc(threadsTable.lastMessageDate)],
        });
      }

      return res.json(threadsList);
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
}

export const emailController = new EmailController();
