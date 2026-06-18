import { useAppStore, Theme } from '@/store/useAppStore';

/* ──────────────────────────────────────────────
 * useTheme Hook
 *
 * Provides a clean interface for theme state and
 * toggle actions. Reads from the global Zustand
 * store and exposes the current theme, setter,
 * and toggle function.
 * ────────────────────────────────────────────── */

interface UseThemeReturn {
  /** Current active theme ('light' or 'dark') */
  theme: Theme;
  /** Set the theme explicitly */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
  /** Whether the current theme is dark mode */
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };
}
