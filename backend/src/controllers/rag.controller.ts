import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ragService } from '../services/rag.service';
import { db } from '../db/connection';
import { chatMessages as chatMessagesTable } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import * as crypto from 'crypto';

class RAGController {
  async askQuestion(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { query, sessionId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required.' });
    }

    const currentSessionId = sessionId || crypto.randomUUID();

    try {
      // Get RAG answer
      const result = await ragService.answerQuery(userId, currentSessionId, query);

      // Save user question to chat history
      await db.insert(chatMessagesTable).values({
        userId,
        sessionId: currentSessionId,
        role: 'user',
        content: query,
      });

      // Save assistant response to chat history
      await db.insert(chatMessagesTable).values({
        userId,
        sessionId: currentSessionId,
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
      });

      return res.json({
        answer: result.answer,
        sources: result.sources,
        sessionId: currentSessionId,
      });
    } catch (error: any) {
      console.error('Error answering question in RAGController:', error);
      return res.status(500).json({ error: error.message || 'Failed to answer question.' });
    }
  }

  async getChatHistory(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { sessionId } = req.params;

    try {
      const messages = await db.query.chatMessages.findMany({
        where: and(eq(chatMessagesTable.userId, userId), eq(chatMessagesTable.sessionId, sessionId)),
        orderBy: [chatMessagesTable.createdAt],
      });

      return res.json(messages);
    } catch (error: any) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch chat history.' });
    }
  }

  async getChatSessions(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    try {
      // Select distinct sessionIds, fetching last active date and title (first user query)
      const sessions = await db
        .select({
          sessionId: chatMessagesTable.sessionId,
          lastActive: sql`max(${chatMessagesTable.createdAt})`,
          title: sql`min(case when ${chatMessagesTable.role} = 'user' then ${chatMessagesTable.content} end)`,
        })
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.userId, userId))
        .groupBy(chatMessagesTable.sessionId)
        .orderBy(sql`max(${chatMessagesTable.createdAt}) desc`);

      return res.json(sessions);
    } catch (error: any) {
      console.error('Error fetching chat sessions:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch chat sessions.' });
    }
  }
}

export const ragController = new RAGController();
