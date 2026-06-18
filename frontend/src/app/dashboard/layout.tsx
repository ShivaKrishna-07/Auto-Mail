'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { RefreshCw } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loadingSession, loadUserSession } = useAuth();

  useEffect(() => {
    loadUserSession();
  }, [loadUserSession]);

  useEffect(() => {
    // Redirect if session loading is complete and no user profile is found
    if (!loadingSession && !user) {
      router.push('/');
    }
  }, [loadingSession, user, router]);

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Suspense fallback={<div className="w-64 border-r border-border bg-sidebar" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
