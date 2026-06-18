import { create } from 'zustand';
import { authService } from '@/features/auth/services/auth.service';
import { api } from '@/lib/api';

import { toast } from 'sonner';

/* ──────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────── */

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export type Theme = 'light' | 'dark';

export type SyncStatus = 'idle' | 'synced' | 'error';

export interface SyncProgress {
  total?: number;
  processed?: number;
  statusMessage?: string;
}

/* ──────────────────────────────────────────────
 * Store Interface
 * ────────────────────────────────────────────── */

interface AppState {
  // ── User Profile (always fetched fresh, never cached) ──
  user: UserProfile | null;
  isGmailLinked: boolean;
  gmailEmail: string | null;
  loadingSession: boolean;

  // ── Theme ──
  theme: Theme;

  // ── Workspace Sync ──
  syncing: boolean;
  syncStatus: SyncStatus;
  lastSynced: string | null;
  syncProgress: SyncProgress | null;

  // ── User Actions ──
  setUser: (user: UserProfile | null, isGmailLinked: boolean, gmailEmail: string | null) => void;
  loadUserSession: () => Promise<void>;
  logout: () => void;

  // ── Theme Actions ──
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // ── Sync Actions ──
  setSyncing: (syncing: boolean) => void;
  setSyncStatus: (syncStatus: SyncStatus) => void;
  setLastSynced: (lastSynced: string | null) => void;
  setSyncProgress: (progress: SyncProgress | null) => void;
  fetchSyncStatus: () => Promise<void>;
  triggerSync: (limit?: number) => Promise<void>;
}

/* ──────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────── */

/** Apply the theme class to the document root element */
function applyThemeToDOM(theme: Theme): void {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/** Read the persisted theme preference from localStorage */
function getPersistedTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('automail_theme');
  return stored === 'light' ? 'light' : 'dark';
}

/** Save theme preference to localStorage */
function persistTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('automail_theme', theme);
}

/* ──────────────────────────────────────────────
 * Zustand Store
 * ────────────────────────────────────────────── */

export const useAppStore = create<AppState>((set, get) => ({
  // ── Initial State ──
  user: null,
  isGmailLinked: false,
  gmailEmail: null,
  loadingSession: true,
  theme: getPersistedTheme(),
  syncing: false,
  syncStatus: 'idle',
  lastSynced: null,
  syncProgress: null,

  // ── User Actions ──

  setUser: (user, isGmailLinked, gmailEmail) => set({ user, isGmailLinked, gmailEmail }),

  /**
   * Fetches the current user profile directly from the backend API.
   * No caching is applied — every call hits `/api/auth/me` fresh.
   */
  loadUserSession: async () => {
    set({ loadingSession: true });

    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('gmail_auth_token');
    if (!token) {
      set({ user: null, isGmailLinked: false, gmailEmail: null, loadingSession: false });
      return;
    }

    try {
      const data = await authService.getCurrentUser();
      set({
        user: data.user,
        isGmailLinked: data.isGmailLinked,
        gmailEmail: data.gmailEmail,
        loadingSession: false,
      });
    } catch (e) {
      console.error('Failed to load session profile in Zustand:', e);
      get().logout();
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gmail_auth_token');
      localStorage.removeItem('gmail_user_data');
      window.location.href = '/';
    }
    set({ user: null, isGmailLinked: false, gmailEmail: null, loadingSession: false });
  },

  // ── Theme Actions ──

  setTheme: (theme) => {
    set({ theme });
    applyThemeToDOM(theme);
    persistTheme(theme);
  },

  toggleTheme: () => {
    const currentTheme = get().theme;
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  // ── Sync Actions ──

  setSyncing: (syncing) => set({ syncing }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setLastSynced: (lastSynced) => set({ lastSynced }),
  setSyncProgress: (syncProgress) => set({ syncProgress }),

  /** Fetch the current sync status from the backend */
  fetchSyncStatus: async () => {
    try {
      const data = await api.get('/api/sync/status');
      
      // Update syncing state if it changed
      if (data.syncing !== undefined && data.syncing !== get().syncing) {
        set({ syncing: data.syncing });
      }

      // Update progress
      if (data.syncing) {
        set({ 
          syncProgress: { 
            total: data.total, 
            processed: data.processed, 
            statusMessage: data.statusMessage 
          } 
        });
      } else {
        set({ syncProgress: null });
      }

      if (data.lastSyncedAt) {
        set({
          syncStatus: 'synced',
          lastSynced: new Date(data.lastSyncedAt).toLocaleString(),
        });
      }
    } catch (e) {
      console.warn('Failed to fetch sync status:', e);
    }
  },

  /** Trigger an inbox sync and start polling global sync state */
  triggerSync: async (limit = 40) => {
    // If already syncing, don't start another poll
    if (get().syncing) return;
    
    set({ syncing: true, syncProgress: null });
    try {
      await api.post('/api/sync/trigger', { limit });
      toast.info('Sync started in the background. You can continue using the app.');
      
      // Start Polling
      const pollInterval = setInterval(async () => {
        await get().fetchSyncStatus();
        
        // If syncing finished, stop polling
        if (!get().syncing) {
          clearInterval(pollInterval);
          set({
            syncStatus: 'synced',
            lastSynced: new Date().toLocaleString(),
            syncProgress: null,
          });
          toast.success('Inbox sync complete!');
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('automail-synced'));
          }
        }
      }, 3000); // Poll every 3 seconds
      
    } catch (e) {
      console.error('Manual sync failed:', e);
      set({ syncStatus: 'error', syncing: false, syncProgress: null });
    }
  },
}));
