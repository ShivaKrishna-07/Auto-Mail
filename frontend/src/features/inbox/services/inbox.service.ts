import { api } from '@/lib/api';

export const inboxService = {
  async getThreads(category?: string): Promise<any[]> {
    const url = category ? `/api/emails/threads?category=${category}` : '/api/emails/threads';
    return api.get(url);
  },

  async getThreadDetails(threadId: string): Promise<any> {
    return api.get(`/api/emails/threads/${threadId}`);
  },

  async generateAIDraft(threadId: string, prompt: string): Promise<{ draft: string }> {
    return api.post('/api/emails/draft', {
      type: 'reply',
      threadId,
      prompt,
    });
  },

  async sendReply(threadId: string, body: string): Promise<{ success: boolean; result: any }> {
    return api.post('/api/emails/reply', {
      threadId,
      body,
    });
  },
};
