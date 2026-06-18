'use client';

import React, { useEffect, useState } from 'react';
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
  Tag,
  ChevronDown,
  ChevronRight,
  UserCircle,
  Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const user = useAppStore((s) => s.user);
  const gmailEmail = useAppStore((s) => s.gmailEmail);
  const logout = useAppStore((s) => s.logout);

  const syncing = useAppStore((s) => s.syncing);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncProgress = useAppStore((s) => s.syncProgress);
  const fetchSyncStatus = useAppStore((s) => s.fetchSyncStatus);
  const triggerSync = useAppStore((s) => s.triggerSync);

  const { theme, toggleTheme } = useTheme();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

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
  const syncStatusLabel = syncStatus === 'synced' ? 'Up to date' : syncStatus === 'error' ? 'Error' : 'Needs Update';
  const syncStatusColor = syncStatus === 'synced' ? 'bg-[#10B981]' : syncStatus === 'error' ? 'bg-destructive' : 'bg-yellow-500';

  const categories = [
    { name: 'Professional' },
    { name: 'Personal' },
    { name: 'Notification' },
    { name: 'Finance' },
    { name: 'Newsletter' },
    { name: 'Job' },
  ];

  return (
    <aside className="w-[270px] border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-screen shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 shrink-0">
        <div className="w-7 h-7 rounded-[8px] bg-foreground text-background flex items-center justify-center font-bold text-[14px]">
          A
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[15px] leading-tight text-foreground">Auto Mail</span>
        </div>
      </div>

      {/* Sync Control Block */}
      <div className="px-4 pb-4 shrink-0">
        <div className="bg-card/50 rounded-[12px] p-3 border border-border/50 flex flex-col gap-2">
          <div className="flex justify-between items-center text-[11px] text-muted-foreground font-medium">
            <span>Inbox Sync</span>
            {!syncing && (
              <span className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${syncStatusColor}`} />
                {syncStatusLabel}
              </span>
            )}
          </div>
          
          {syncing ? (
            <div className="flex flex-col gap-2 py-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-foreground flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {syncProgress?.statusMessage || 'Updating emails...'}
                </span>
                <span className="text-muted-foreground">
                  {syncProgress?.total ? Math.round(((syncProgress.processed || 0) / syncProgress.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                <div 
                  className="h-full bg-foreground transition-all duration-300 ease-out" 
                  style={{ width: syncProgress?.total ? `${(syncProgress.processed || 0) / syncProgress.total * 100}%` : '0%' }}
                />
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleSync} 
              disabled={syncing} 
              variant="secondary" 
              size="sm" 
              className="w-full text-[12px] h-8 bg-background border border-border hover:bg-muted/50 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              Refresh Emails
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar pb-6">
        <div className="space-y-1">
          <span className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground/80 block">
            Workspace
          </span>
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox, path: '/dashboard', active: pathname === '/dashboard' && !activeCategory },
            { id: 'chat', label: 'AI Search', icon: MessageSquare, path: '/dashboard/chat', active: pathname === '/dashboard/chat' },
            { id: 'compose', label: 'Compose', icon: PenTool, path: '/dashboard/compose', active: pathname === '/dashboard/compose' },
          ].map((item) => (
            <Button 
              key={item.id}
              variant="ghost" 
              className={`w-full justify-start gap-3 text-[13px] h-9 px-3 relative rounded-[8px] transition-colors ${item.active ? 'bg-secondary text-foreground font-semibold hover:bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`} 
              onClick={() => router.push(item.path)}
            >
              {item.active && (
                <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-foreground rounded-r-full" />
              )}
              <item.icon className={`w-[18px] h-[18px] ${item.active ? 'stroke-[2.5px]' : ''}`} />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Categories Section */}
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-between text-[13px] h-9 px-3 relative rounded-[8px] transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50" 
            onClick={() => setCategoriesOpen(!categoriesOpen)}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-[18px] h-[18px]" />
              Folders
            </div>
            {categoriesOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
          
          <AnimatePresence>
            {categoriesOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-0.5 pt-1"
              >
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.name;
                  return (
                    <Button
                      key={cat.name}
                      variant="ghost"
                      className={`w-full justify-start gap-3 text-[13px] h-9 px-3 relative rounded-[8px] transition-colors ${isActive ? 'bg-secondary text-foreground font-semibold hover:bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                      onClick={() => router.push(`/dashboard?category=${cat.name}`)}
                    >
                      {isActive && (
                        <motion.div layoutId="sidebar-active-cat" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-foreground rounded-r-full" />
                      )}
                      <Tag className={`w-[16px] h-[16px] ${isActive ? 'stroke-[2.5px]' : ''}`} />
                      <span>{cat.name}</span>
                    </Button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Footer System Control panel */}
      <div className="p-4 border-t border-border shrink-0 bg-sidebar flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
            <UserCircle className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="text-[12px] font-semibold text-foreground truncate">
              {gmailEmail || user?.email || 'Not Linked'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button 
            onClick={toggleTheme} 
            variant="ghost" 
            size="sm" 
            className="flex-1 h-8 text-muted-foreground hover:text-foreground rounded-[8px] bg-card/30 border border-border/50 hover:bg-muted"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 mr-2" /> : <Moon className="w-3.5 h-3.5 mr-2" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
          <Button 
            onClick={logout} 
            variant="ghost" 
            size="sm" 
            className="flex-1 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[8px] border border-transparent hover:border-destructive/20"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
