import { useCallback } from 'react';
import { useAppStore, UserProfile } from '@/store/useAppStore';
import { authService } from '../services/auth.service';

/* ──────────────────────────────────────────────
 * useAuth Hook
 *
 * Provides a clean interface for authentication
 * state and actions. Components should use this
 * hook instead of importing useAppStore directly
 * for auth-related concerns.
 * ────────────────────────────────────────────── */

interface UseAuthReturn {
  /** Currently authenticated user profile (null if not logged in) */
  user: UserProfile | null;
  /** Whether a Gmail account is linked to the user */
  isGmailLinked: boolean;
  /** The linked Gmail email address */
  gmailEmail: string | null;
  /** Whether the session is still being loaded from the backend */
  loadingSession: boolean;
  /** Fetch the user session from the backend (always fresh, no caching) */
  loadUserSession: () => Promise<void>;
  /** Sign out and clear all local tokens */
  logout: () => void;
  /** Initiate the Google OAuth login flow */
  initiateLogin: () => Promise<void>;
  /** Exchange an OAuth authorization code for a token and save session */
  exchangeCode: (code: string) => Promise<{ token: string; user: any }>;
}

export function useAuth(): UseAuthReturn {
  const user = useAppStore((s) => s.user);
  const isGmailLinked = useAppStore((s) => s.isGmailLinked);
  const gmailEmail = useAppStore((s) => s.gmailEmail);
  const loadingSession = useAppStore((s) => s.loadingSession);
  const loadUserSession = useAppStore((s) => s.loadUserSession);
  const logout = useAppStore((s) => s.logout);

  /**
   * Redirects the user to Google's OAuth consent screen.
   * Called from the login page.
   */
  const initiateLogin = useCallback(async () => {
    const data = await authService.getGoogleAuthUrl();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Google OAuth URL not returned from API.');
    }
  }, []);

  /**
   * Exchanges the OAuth authorization code for a JWT token.
   * Stores the token and user data in localStorage.
   */
  const exchangeCode = useCallback(async (code: string) => {
    const data = await authService.handleGoogleCallback(code);
    if (data.token) {
      localStorage.setItem('gmail_auth_token', data.token);
      localStorage.setItem('gmail_user_data', JSON.stringify(data.user));
    }
    return data;
  }, []);

  return {
    user,
    isGmailLinked,
    gmailEmail,
    loadingSession,
    loadUserSession,
    logout,
    initiateLogin,
    exchangeCode,
  };
}
