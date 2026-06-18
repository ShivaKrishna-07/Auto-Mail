import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';
import { withGeminiFallback } from '../utils/gemini.util';

class AIService {

  async summarizeEmail(body: string): Promise<string> {
    const cleanBody = body?.trim();
    if (!cleanBody) return 'Empty email content.';
    
    try {
      const response = await withGeminiFallback(ai => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following email in 1 to 2 concise, clear sentences. Focus on the core request or message. Avoid greeting/sign-off references.
        
Email Content:
${cleanBody.substring(0, 10000)}`,
      }));
      return response.text?.trim() || 'Summary unavailable.';
    } catch (error) {
      console.error('Error in AIService.summarizeEmail:', error);
      return 'Failed to generate email summary.';
    }
  }

  async categorizeEmail(subject: string, body: string): Promise<string> {
    const textToClassify = `Subject: ${subject || '(No Subject)'}\n\nBody:\n${body || ''}`.substring(0, 8000);
    try {
      const response = await withGeminiFallback(ai => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert email classification system.
Classify the email below into exactly ONE of these categories:
- Newsletter (subscriptions, digests, articles, promotional updates, mailing lists)
- Finance (bank alerts, statements, receipts, invoices, billing, salary)
- Job (recruitment, interview schedules, job applications, job alerts, offers)
- Notification (alerts, password resets, verification codes, login confirmations, updates from SaaS/platforms)
- Personal (conversations with family, friends, personal informal chats)
- Professional (work emails, business communications, client discussions, project updates, official items)

Return ONLY the single category name from the list above. Do not include markdown code blocks, quotes, reasoning, or punctuation.

Email:
${textToClassify}`,
      }));

      const category = response.text?.trim() || 'Professional';
      const validCategories = ['Newsletter', 'Finance', 'Job', 'Notification', 'Personal', 'Professional'];
      
      for (const valid of validCategories) {
        if (category.toLowerCase().includes(valid.toLowerCase())) {
          return valid;
        }
      }
      return 'Professional';
    } catch (error) {
      console.error('Error in AIService.categorizeEmail:', error);
      return 'Professional';
    }
  }

  async summarizeThread(messages: Array<{ sender: string; internalDate: Date; body: string }>): Promise<string> {
    if (!messages || messages.length === 0) return 'No messages in thread.';

    const formattedMessages = messages
      .map((m, idx) => `[Email #${idx + 1}] Date: ${m.internalDate.toISOString()}, From: ${m.sender}\nContent:\n${m.body.substring(0, 3000)}`)
      .join('\n\n---\n\n');

    try {
      const response = await withGeminiFallback(ai => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an assistant summarizing a Gmail conversation thread containing ${messages.length} messages.
Draft a concise summary summarizing the timeline of discussion, main topics discussed, key resolutions, and any pending actions/next steps.
Keep the summary professional, clear, and strictly under 150 words. Do not use generic introductions.

Thread Messages:
${formattedMessages}`,
      }));
      return response.text?.trim() || 'Thread summary unavailable.';
    } catch (error) {
      console.error('Error in AIService.summarizeThread:', error);
      return 'Failed to generate thread summary.';
    }
  }

  async draftEmail(instructions: string, userContext: string): Promise<string> {
    try {
      const response = await withGeminiFallback(ai => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a high-level executive assistant. Draft a professional email based on the following instructions and context.
Provide a clean draft with a Subject line and an Email Body. Put brackets around placeholder details where the user needs to fill in their own info.

Context:
${userContext || 'No additional context provided.'}

Instructions:
${instructions}

Respond with ONLY the drafted content, formatting it clearly as:
Subject: [Draft Subject]

Dear [Name],
[Draft Body]`,
      }));
      return response.text?.trim() || '';
    } catch (error) {
      console.error('Error in AIService.draftEmail:', error);
      throw error;
    }
  }

  async draftReply(threadSummary: string, lastEmailBody: string, userPrompt: string): Promise<string> {
    try {
      const response = await withGeminiFallback(ai => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are drafting a professional reply to the last message of an email conversation thread.

Conversation History Summary:
${threadSummary}

Last Received Message Body:
${lastEmailBody?.substring(0, 4000)}

User's response directives:
${userPrompt}

Draft a context-aware email reply. Respond with ONLY the reply body text. Do not include a subject line or greeting/closing placeholders if they are not part of the message body. Keep it direct and natural.`,
      }));
      return response.text?.trim() || '';
    } catch (error) {
      console.error('Error in AIService.draftReply:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
