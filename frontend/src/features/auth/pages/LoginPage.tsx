'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Mail, Sparkles, Shield, RefreshCw, Sun, Moon } from 'lucide-react';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const { initiateLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Check if token exists, auto-redirect to dashboard
    const token = localStorage.getItem('gmail_auth_token');
    if (token) {
      window.location.href = '/dashboard';
    }

    // Set initial theme based on store preference
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleLoginClick = () => {
    setShowConsentModal(true);
  };

  const handleLogin = async () => {
    setShowConsentModal(false);
    setLoading(true);
    setError(null);
    try {
      await initiateLogin();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize Google Login. Ensure backend is running.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground overflow-hidden transition-colors duration-300">
      {/* Decorative Gradient Background Elements Removed */}

      {/* Theme Switcher Header */}
      <div className="absolute top-6 right-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleTheme} 
          className="rounded-[8px] px-3 bg-card/30 border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 mr-2" /> : <Moon className="w-3.5 h-3.5 mr-2" />}
          {theme === 'dark' ? 'Light' : 'Dark'}
        </Button>
      </div>

      <div className="w-full max-w-lg p-6 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur-sm text-xs font-medium text-foreground mb-3">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            Smart Email Assistant
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground mb-2">
            Auto Mail
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Sync your emails, ask questions about your history, automatically categorize, and draft fast replies.
          </p>
        </div>

        <Card className="border border-border bg-card/60 backdrop-blur-md shadow-2xl overflow-hidden rounded-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold">Connect your Account</CardTitle>
            <CardDescription className="text-xs">
              Securely authenticate via Google OAuth to access your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <Button
              onClick={handleLoginClick}
              disabled={loading}
              className="w-full py-6 text-sm font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-foreground/5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-center">
                {error}
              </div>
            )}

            <div className="border-t border-border pt-5 grid grid-cols-3 gap-4 text-center text-[10px] text-muted-foreground">
              <div className="flex flex-col items-center gap-1.5">
                <div className="p-2 rounded-full border border-border bg-card/40">
                  <Mail className="w-4 h-4 text-foreground/80" />
                </div>
                <span>Workspace Sync</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="p-2 rounded-full border border-border bg-card/40">
                  <Sparkles className="w-4 h-4 text-foreground/80" />
                </div>
                <span>Smart AI Chat</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="p-2 rounded-full border border-border bg-card/40">
                  <Shield className="w-4 h-4 text-foreground/80" />
                </div>
                <span>Secure Sandbox</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground/80 mt-6 col-span-3">
          By signing in, you grant read-write access to read emails and draft responses inside a sandbox environment. Your credentials are encrypted.
        </p>
      </div>

      <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
        <DialogContent className="sm:max-w-[425px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-5 h-5 text-primary" />
              Demo Notice
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              This app is currently awaiting Google's OAuth verification. Google will ask for Gmail permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-4">
            <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-destructive/20 rounded-md">
                  <Shield className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">If you see an "App isn't verified" screen:</h4>
                  <ol className="text-xs text-muted-foreground mt-2 space-y-1.5 list-decimal list-inside font-medium">
                    <li>Click <strong className="text-foreground">"Advanced"</strong></li>
                    <li>Click the <strong className="text-foreground">"Go to auto-mail-9wyd.onrender.com (unsafe)"</strong> option</li>
                    <li>Continue with Google Sign-In</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
              <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                Your Google credentials remain secure and are never stored by Auto Mail. We do not use your personal Gmail data to train AI models, and you can revoke access anytime.
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between items-center bg-transparent border-t-0 p-0 -mx-0 -mb-0 pt-2">
            <Button variant="ghost" onClick={() => setShowConsentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogin} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Continue to Google
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
