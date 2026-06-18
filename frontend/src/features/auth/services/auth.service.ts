import { api } from '@/lib/api';

export const authService = {
  async getGoogleAuthUrl(): Promise<{ url: string }> {
    return api.get('/api/auth/google/url');
  },

  async handleGoogleCallback(code: string): Promise<{ token: string; user: any }> {
    return api.get(`/api/auth/google/callback?code=${code}`);
  },

  async getCurrentUser(): Promise<{ user: any; isGmailLinked: boolean; gmailEmail: string | null }> {
    return api.get('/api/auth/me');
  },
};
