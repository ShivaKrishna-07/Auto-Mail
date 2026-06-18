'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { 
  Inbox, 
  MessageSquare, 
  PenTool, 
  LogOut, 
  RefreshCw, 
  Sun, 
  Moon, 
  Sparkles,
  Tag
} from 'lucide-react';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Bind user profile and sync states from Zustand store
  const user = useAppStore((s) => s.user);
  const isGmailLinked = useAppStore((s) => s.isGmailLinked);
  const gmailEmail = useAppStore((s) => s.gmailEmail);
  const logout = useAppStore((s) => s.logout);

  // Sync states from Zustand store (centralized)
  const syncing = useAppStore((s) => s.syncing);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const lastSynced = useAppStore((s) => s.lastSynced);
  const fetchSyncStatus = useAppStore((s) => s.fetchSyncStatus);
  const triggerSync = useAppStore((s) => s.triggerSync);

  // Theme from custom hook
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  const handleSync = async () => {
    await triggerSync();
    if (pathname === '/dashboard') {
      router.refresh();
    }
  };

  const activeCategory = searchParams.get('category');

  const syncStatusLabel = syncStatus === 'synced' ? 'Synced' : syncStatus === 'error' ? 'Error' : 'Not Synced';
  const syncStatusColor = syncStatus === 'synced' ? 'text-green-500' : syncStatus === 'error' ? 'text-destructive' : 'text-yellow-500';

  const categories = [
    { name: 'Professional', color: 'bg-blue-500/20 text-blue-400' },
    { name: 'Personal', color: 'bg-green-500/20 text-green-400' },
    { name: 'Notification', color: 'bg-yellow-500/20 text-yellow-400' },
    { name: 'Finance', color: 'bg-purple-500/20 text-purple-400' },
    { name: 'Newsletter', color: 'bg-pink-500/20 text-pink-400' },
    { name: 'Job', color: 'bg-orange-500/20 text-orange-400' },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-screen transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-2">
        <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-black">
          A
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm leading-none">Auto Mail</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-primary" /> Gemini AI Engine
          </span>
        </div>
      </div>

      {/* User Session Profile Card */}
      <div className="p-4 border-b border-border bg-card/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-foreground font-bold">
          {user?.name?.[0] || user?.email?.[0] || 'U'}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-xs truncate leading-tight">{user?.name || 'Auto Mail User'}</span>
          <span className="text-[10px] text-muted-foreground truncate">{gmailEmail || user?.email}</span>
        </div>
      </div>

      {/* Sync Control Block */}
      <div className="p-4 border-b border-border bg-muted/20 flex flex-col gap-2">
        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
          <span>Inbox Sync Status</span>
          <span className={`font-semibold ${syncStatusColor}`}>
            {syncing ? 'Syncing...' : syncStatusLabel}
          </span>
        </div>
        {lastSynced && (
          <span className="text-[9px] text-muted-foreground/80 leading-none">
            Last: {lastSynced}
          </span>
        )}
        <Button 
          onClick={handleSync} 
          disabled={syncing} 
          variant="outline" 
          size="sm" 
          className="w-full text-xs font-semibold py-1 flex items-center gap-2 border-border/80 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing Inbox...' : 'Sync Now'}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">
            Workspace
          </span>
          <Button 
            variant={pathname === '/dashboard' && !activeCategory ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 text-xs" 
            onClick={() => router.push('/dashboard')}
          >
            <Inbox className="w-4 h-4" />
            Inbox
          </Button>
          <Button 
            variant={pathname === '/dashboard/chat' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 text-xs" 
            onClick={() => router.push('/dashboard/chat')}
          >
            <MessageSquare className="w-4 h-4" />
            AI Chat (RAG)
          </Button>
          <Button 
            variant={pathname === '/dashboard/compose' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 text-xs" 
            onClick={() => router.push('/dashboard/compose')}
          >
            <PenTool className="w-4 h-4" />
            Compose Email
          </Button>
        </div>

        {/* Categories Section */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">
            Smart Categories
          </span>
          {categories.map((cat) => (
            <Button
              key={cat.name}
              variant={activeCategory === cat.name ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3 text-xs"
              onClick={() => router.push(`/dashboard?category=${cat.name}`)}
            >
              <Tag className="w-4 h-4" />
              <span>{cat.name}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Footer System Control panel */}
      <div className="p-4 border-t border-border mt-auto space-y-2">
        <Button 
          onClick={toggleTheme} 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
        </Button>
        <Button 
          onClick={logout} 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
