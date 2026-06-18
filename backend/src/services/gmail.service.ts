import { google, gmail_v1 } from 'googleapis';
import { db } from '../db/connection';
import { threads as threadsTable, emails as emailsTable, gmailAccounts as gmailAccountsTable } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authService } from './auth.service';
import { aiService } from './ai.service';
import { embeddingsService } from './embeddings.service';
import { cleanHtml, getHeader } from '../utils/parser';

class GmailService {
  /**
   * Recursive helper to extract text and html body from message payload parts.
   */
  private parseMessagePayload(payload: any): { text: string; html: string } {
    let text = '';
    let html = '';

    if (!payload) return { text, html };

    if (payload.body && payload.body.data) {
      const decodedData = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      if (payload.mimeType === 'text/plain') {
        text = decodedData;
      } else if (payload.mimeType === 'text/html') {
        html = decodedData;
      }
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const parsed = this.parseMessagePayload(part);
        if (parsed.text) text += (text ? '\n' : '') + parsed.text;
        if (parsed.html) html += (html ? '\n' : '') + parsed.html;
      }
    }

    return { text, html };
  }

  /**
   * Syncs emails for a user. Supports initial sync and incremental sync.
   * @param userId The app user ID
   * @param maxSyncLimit Maximum messages to sync in this request (default 50)
   */
  async syncEmails(userId: string, maxSyncLimit = 50): Promise<{ syncedCount: number; status: string }> {
    const client = await authService.getValidClient(userId);
    const gmail = google.gmail({ version: 'v1', auth: client });

    const account = await db.query.gmailAccounts.findFirst({
      where: eq(gmailAccountsTable.userId, userId),
    });

    if (!account) {
      throw new Error('Gmail account not registered for user');
    }

    let syncedCount = 0;
    const startHistoryId = account.historyId;

    try {
      if (startHistoryId) {
        // Attempt Incremental Sync
        try {
          const historyResponse = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: startHistoryId,
            maxResults: 100,
          });

          const historyRecords = historyResponse.data.history || [];
          const messageIdsToFetch = new Set<string>();

          for (const record of historyRecords) {
            if (record.messagesAdded) {
              for (const added of record.messagesAdded) {
                if (added.message?.id) {
                  messageIdsToFetch.add(added.message.id);
                }
              }
            }
          }

          if (messageIdsToFetch.size > 0) {
            syncedCount = await this.fetchAndProcessMessages(
              userId,
              gmail,
              Array.from(messageIdsToFetch).slice(0, maxSyncLimit)
            );
          }

          // Update current historyId
          const profile = await gmail.users.getProfile({ userId: 'me' });
          await db.update(gmailAccountsTable)
            .set({
              historyId: profile.data.historyId || account.historyId,
              updatedAt: new Date(),
            })
            .where(eq(gmailAccountsTable.id, account.id));

          return { syncedCount, status: 'incremental_sync_success' };
        } catch (historyError: any) {
          console.warn('History API sync failed (possibly expired startHistoryId). Falling back to date-based incremental sync.', historyError.message);
          // Fallback: fetch messages since the last received message date in database
        }
      }

      // Initial Sync or Date-based Incremental Fallback
      let query = '';
      const lastEmail = await db.query.emails.findFirst({
        where: eq(emailsTable.userId, userId),
        orderBy: [desc(emailsTable.internalDate)],
      });

      if (lastEmail) {
        // Fallback incremental: query messages received after the last sync date
        const secondsSinceEpoch = Math.floor(lastEmail.internalDate.getTime() / 1000);
        query = `after:${secondsSinceEpoch}`;
      }

      let allMessageIds: string[] = [];
      let pageToken: string | undefined = undefined;

      // Fetch message list matching query
      do {
        const listResponse: any = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: Math.min(maxSyncLimit - allMessageIds.length, 50),
          pageToken,
        });

        const messages = listResponse.data.messages || [];
        allMessageIds.push(...messages.map((m: gmail_v1.Schema$Message) => m.id).filter((id: string | null | undefined): id is string => !!id));
        pageToken = listResponse.data.nextPageToken || undefined;

        if (allMessageIds.length >= maxSyncLimit) {
          break;
        }
      } while (pageToken);

      // Process fetched messages
      if (allMessageIds.length > 0) {
        syncedCount = await this.fetchAndProcessMessages(userId, gmail, allMessageIds);
      }

      // Save latest historyId from Gmail Profile
      const profile = await gmail.users.getProfile({ userId: 'me' });
      await db.update(gmailAccountsTable)
        .set({
          historyId: profile.data.historyId || null,
          updatedAt: new Date(),
        })
        .where(eq(gmailAccountsTable.id, account.id));

      return { syncedCount, status: 'full_sync_success' };
    } catch (error) {
      console.error('Error syncing emails:', error);
      throw error;
    }
  }

  /**
   * Fetches full email details, cleans content, runs LLM pipeline (summary, category, vector),
   * and upserts threads/emails records in the database.
   */
  private async fetchAndProcessMessages(
    userId: string,
    gmail: gmail_v1.Gmail,
    messageIds: string[]
  ): Promise<number> {
    let processed = 0;
    const threadIdsToUpdate = new Set<string>();

    for (const messageId of messageIds) {
      try {
        // Check if email already exists
        const existingEmail = await db.query.emails.findFirst({
          where: eq(emailsTable.id, messageId),
        });
        if (existingEmail) continue;

        // Fetch full message details
        const res = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

        const msg = res.data;
        if (!msg.id || !msg.threadId) continue;

        const headersList = msg.payload?.headers || [];
        const subject = getHeader(headersList, 'Subject') || '(No Subject)';
        const sender = getHeader(headersList, 'From') || 'Unknown';
        const receiver = getHeader(headersList, 'To') || 'Unknown';
        const internalDate = msg.internalDate ? new Date(parseInt(msg.internalDate)) : new Date();

        // Extract Message Headers for Thread replies
        const msgHeaders = {
          messageIdHeader: getHeader(headersList, 'Message-ID'),
          inReplyTo: getHeader(headersList, 'In-Reply-To'),
          references: getHeader(headersList, 'References'),
        };

        // Extract plain text body
        const parsedBody = this.parseMessagePayload(msg.payload);
        let plainBody = parsedBody.text;
        
        // If text/plain was empty, clean text out of HTML
        if (!plainBody.trim() && parsedBody.html) {
          plainBody = cleanHtml(parsedBody.html);
        }
        
        if (!plainBody.trim()) {
          plainBody = msg.snippet || 'No body content.';
        }

        // 1. Thread Upsert
        let dbThread = await db.query.threads.findFirst({
          where: eq(threadsTable.id, msg.threadId),
        });

        if (!dbThread) {
          const [newThread] = await db.insert(threadsTable).values({
            id: msg.threadId,
            userId,
            subject,
            snippet: msg.snippet || null,
            lastMessageDate: internalDate,
          }).returning();
          dbThread = newThread;
        } else {
          // If the message is newer, update last message date
          const currentLastDate = dbThread.lastMessageDate;
          if (!currentLastDate || internalDate.getTime() > currentLastDate.getTime()) {
            await db.update(threadsTable).set({
              lastMessageDate: internalDate,
              snippet: msg.snippet || dbThread.snippet,
              updatedAt: new Date(),
            }).where(eq(threadsTable.id, msg.threadId));
          }
        }

        // 2. AI Processing Pipeline (Summary, Category, Vector)
        const summary = await aiService.summarizeEmail(plainBody);
        const category = await aiService.categorizeEmail(subject, plainBody);
        const embedding = await embeddingsService.generateEmbedding(plainBody);

        const isNewsletter = category === 'Newsletter';

        // 3. Save Email
        await db.insert(emailsTable).values({
          id: msg.id,
          threadId: msg.threadId,
          userId,
          sender,
          receiver,
          subject,
          body: plainBody,
          html: parsedBody.html || null,
          internalDate,
          category,
          summary,
          embedding,
          headers: msgHeaders,
          labelIds: msg.labelIds || null,
          isNewsletter,
        });

        threadIdsToUpdate.add(msg.threadId);
        processed++;
      } catch (msgError) {
        console.error(`Error processing message ${messageId}:`, msgError);
      }
    }

    // 4. Update Thread Summaries & Embeddings for modified threads
    for (const threadId of threadIdsToUpdate) {
      try {
        const threadEmails = await db.query.emails.findMany({
          where: eq(emailsTable.threadId, threadId),
          orderBy: [emailsTable.internalDate],
        });

        if (threadEmails.length > 0) {
          const formattedEmails = threadEmails.map(e => ({
            sender: e.sender,
            internalDate: e.internalDate,
            body: e.body || '',
          }));

          const threadSummary = await aiService.summarizeThread(formattedEmails);
          const summaryEmbedding = await embeddingsService.generateEmbedding(threadSummary);

          await db.update(threadsTable).set({
            summary: threadSummary,
            summaryEmbedding,
            updatedAt: new Date(),
          }).where(eq(threadsTable.id, threadId));
        }
      } catch (threadError) {
        console.error(`Error generating thread summary for thread ${threadId}:`, threadError);
      }
    }

    return processed;
  }

  /**
   * Composes and sends a new standalone email.
   */
  async sendEmail(userId: string, to: string, subject: string, body: string): Promise<any> {
    const client = await authService.getValidClient(userId);
    const gmail = google.gmail({ version: 'v1', auth: client });

    const mailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      '',
      body,
    ];

    const raw = Buffer.from(mailLines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });

    return response.data;
  }

  /**
   * Sends a reply to an existing email thread. Maintains proper headers to avoid splitting threads.
   */
  async replyToThread(userId: string, threadId: string, body: string): Promise<any> {
    const client = await authService.getValidClient(userId);
    const gmail = google.gmail({ version: 'v1', auth: client });

    // Retrieve emails in this thread to match subject and extract reply headers
    const threadEmails = await db.query.emails.findMany({
      where: eq(emailsTable.threadId, threadId),
      orderBy: [desc(emailsTable.internalDate)], // Last email first
    });

    if (threadEmails.length === 0) {
      throw new Error(`Thread ${threadId} not found in database`);
    }

    const lastEmail = threadEmails[0];
    const originalSubject = lastEmail.subject || '';
    const replySubject = originalSubject.toLowerCase().startsWith('re:')
      ? originalSubject
      : `Re: ${originalSubject}`;

    // Extract message-id of the last message to respond to
    const lastHeaders = lastEmail.headers as { messageIdHeader?: string; references?: string } | null;
    const lastMessageId = lastHeaders?.messageIdHeader;
    const parentReferences = lastHeaders?.references || '';

    // Append lastMessageId to the references header chain
    const references = [parentReferences, lastMessageId].filter(Boolean).join(' ');

    // Extract who sent the last email to reply to them (sender)
    // Note: if the user sent the last email, we should reply to the other party.
    // For simplicity, we reply to lastEmail.sender
    const replyTo = lastEmail.sender;

    const mailLines = [
      `To: ${replyTo}`,
      `Subject: ${replySubject}`,
      `In-Reply-To: ${lastMessageId || ''}`,
      `References: ${references}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      '',
      body,
    ];

    const raw = Buffer.from(mailLines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId: threadId,
      },
    });

    return response.data;
  }
}

export const gmailService = new GmailService();
