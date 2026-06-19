import { sql, eq, and } from 'drizzle-orm';
import { db } from '../db/connection';
import { emails as emailsTable, threads as threadsTable } from '../db/schema';
import { embeddingsService } from './embeddings.service';
import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';
import { withGeminiFallback } from '../utils/gemini.util';

class RAGService {

  /**
   * Search emails using vector similarity.
   */
  async searchEmails(userId: string, query: string, limit = 5): Promise<any[]> {
    try {
      const queryEmbedding = await embeddingsService.generateEmbedding(query);
      const formattedEmbedding = JSON.stringify(queryEmbedding);
      
      // SQL expression for cosine similarity: 1 - (embedding <=> queryEmbedding)
      // <=> represents cosine distance in pgvector
      const similaritySql = sql<number>`1 - (${emailsTable.embedding} <=> ${formattedEmbedding}::vector)`;

      const results = await db
        .select({
          id: emailsTable.id,
          threadId: emailsTable.threadId,
          sender: emailsTable.sender,
          receiver: emailsTable.receiver,
          subject: emailsTable.subject,
          body: emailsTable.body,
          internalDate: emailsTable.internalDate,
          category: emailsTable.category,
          summary: emailsTable.summary,
          similarity: similaritySql,
        })
        .from(emailsTable)
        .where(eq(emailsTable.userId, userId))
        .orderBy(sql`${emailsTable.embedding} <=> ${formattedEmbedding}::vector`)
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Error in RAGService.searchEmails:', error);
      throw error;
    }
  }

  /**
   * Evaluates user query against vector search results, prompts Gemini, and returns answers with citations.
   */
  async answerQuery(userId: string, sessionId: string, query: string): Promise<{ answer: string; sources: any[] }> {
    try {
      // 1. Search for top relevant emails
      const relevantEmails = await this.searchEmails(userId, query, 6);
      
      // Filter out matches that have very low relevance (e.g. similarity < 0.1)
      const validSources = relevantEmails.filter(email => email.similarity > 0.15);

      if (validSources.length === 0) {
        return {
          answer: "I couldn't find any relevant emails in your inbox to answer that question. Could you please provide more context or verify your sync status?",
          sources: [],
        };
      }

      // 2. Format emails context for the prompt
      const contextBlocks = validSources.map((email, idx) => {
        return `[Source #${idx + 1}]
Email ID: ${email.id}
Thread ID: ${email.threadId}
Sender: ${email.sender}
Receiver: ${email.receiver}
Date: ${email.internalDate.toISOString()}
Subject: ${email.subject}
Body:
${email.body.substring(0, 2500)}
---------------------------------------------`;
      }).join('\n\n');

      // 3. Compile prompt for Gemini
      const prompt = `You are a helpful and highly capable Gmail Assistant. Your task is to answer the user's question based EXCLUSIVELY on their synced emails provided in the Context section below.

User's Question:
${query}

Context (Relevant emails retrieved from the user's inbox):
${contextBlocks}

Instructions:
1. Provide a comprehensive, clear, natural, and highly readable answer. Speak conversationally as a human assistant.
2. DO NOT include technical jargon, raw email addresses (unless asked), or raw metadata. Use people's natural names instead of raw email strings.
3. Keep the language simple and easy for the user to understand.
4. Do NOT assume, extrapolate, or hallucinate facts that are not explicitly stated in the context.
5. If the emails do not contain enough information, simply state: "I don't have access to emails that can answer this question."
6. For every key fact, date, name, or detail in your response, you MUST cite its source by appending the exact Google Message ID in brackets AT THE VERY END of the sentence, e.g. "She confirmed the meeting for tomorrow [18fb25ad9ef830ba]". This is strictly for hyperlinking. Do NOT mention the ID verbally or in the middle of a sentence.
7. Keep your answer well-structured, utilizing markdown lists and bold text where appropriate to make it highly readable.

Answer:`;

      // 4. Generate Answer using Gemini
      const response = await withGeminiFallback(ai => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      }));

      const answer = response.text?.trim() || 'No answer generated.';

      // 5. Structure source metadata to return to frontend
      const sources = validSources.map(email => ({
        id: email.id,
        threadId: email.threadId,
        sender: email.sender,
        subject: email.subject,
        internalDate: email.internalDate,
        category: email.category,
      }));

      return {
        answer,
        sources,
      };
    } catch (error: any) {
      console.error('Error in RAGService.answerQuery:', error);
      const errorStr = String(error.message || error);
      if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Gemini API quota exceeded. Please try again later.');
      }
      throw error;
    }
  }
}

export const ragService = new RAGService();
