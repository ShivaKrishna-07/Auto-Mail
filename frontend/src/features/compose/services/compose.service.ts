import { api } from '@/lib/api';

export const composeService = {
  async generateAIDraft(prompt: string, context?: string): Promise<{ draft: string }> {
    return api.post('/api/emails/draft', {
      type: 'new',
      prompt,
      context,
    });
  },

  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; result: any }> {
    return api.post('/api/emails/send', {
      to,
      subject,
      body,
    });
  },
};
