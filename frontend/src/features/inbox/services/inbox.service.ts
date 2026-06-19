import { api } from '@/lib/api';

export const inboxService = {
  async getThreads(category?: string, page: number = 1, limit: number = 50): Promise<any> {
    let url = `/api/emails/threads?page=${page}&limit=${limit}`;
    if (category) {
      url += `&category=${category}`;
    }
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

  async summarizeThread(threadId: string): Promise<{ summary: string }> {
    return api.post(`/api/emails/threads/${threadId}/summarize`);
  },

  async categorizeThread(threadId: string): Promise<{ success: boolean; category: string }> {
    const res = await api.post(`/api/emails/thread/${threadId}/categorize`);
    return res.data;
  },

  async getUncategorizedCount(): Promise<number> {
    const res = await api.get('/api/emails/uncategorized-count');
    return res.data.count;
  },

  async categorizeAll(): Promise<{ categorizedCount: number }> {
    const res = await api.post('/api/emails/categorize-all');
    return res.data;
  }
};
