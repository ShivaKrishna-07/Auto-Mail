import { api } from '@/lib/api';

export const chatService = {
  async getSessions(): Promise<any[]> {
    return api.get('/api/chat/sessions');
  },

  async getSessionHistory(sessionId: string): Promise<any[]> {
    return api.get(`/api/chat/sessions/${sessionId}`);
  },

  async askQuestion(query: string, sessionId?: string): Promise<{ answer: string; sources: any[]; sessionId: string }> {
    return api.post('/api/chat/query', {
      query,
      sessionId,
    });
  },
};
