'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Check for error from backend redirect
    const error = searchParams.get('error');
    if (error) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(error));
      return;
    }

    // Read token and user from backend redirect query params
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (!token) {
      setStatus('error');
      setErrorMessage('Authentication token is missing from callback.');
      return;
    }

    try {
      // Store credentials in localStorage
      localStorage.setItem('gmail_auth_token', token);
      if (userParam) {
        localStorage.setItem('gmail_user_data', userParam);
      }

      setStatus('success');

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Callback error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to process authentication.');
    }
  }, [searchParams, router]);

  return (
    <Card className="w-full max-w-md border border-border bg-card/60 backdrop-blur-md shadow-2xl rounded-2xl p-6 text-center relative z-10">
      <CardContent className="pt-6 space-y-6">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-12 h-12 text-primary animate-spin" />
            <h2 className="text-xl font-bold">Authenticating Workspace</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Processing your authentication credentials and linking your inbox.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
            <h2 className="text-xl font-bold">Successfully Connected!</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Workspace synced. Launching your email intelligence dashboard.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-bold text-destructive">Connection Failed</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer"
            >
              Go Back to Sign In
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GoogleCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <Suspense fallback={
        <Card className="w-full max-w-md border border-border bg-card/60 backdrop-blur-md shadow-2xl rounded-2xl p-6 text-center relative z-10">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <RefreshCw className="w-12 h-12 text-primary animate-spin" />
            <h2 className="text-xl font-bold">Loading Authorization Details</h2>
          </CardContent>
        </Card>
      }>
        <GoogleCallbackContent />
      </Suspense>
    </div>
  );
}
