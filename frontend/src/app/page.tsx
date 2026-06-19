'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, FolderOpen, Search, FileText, PenTool, ShieldCheck, RefreshCw, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/hooks/useTheme';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  // Ensure smooth scrolling for anchor links
  useEffect(() => {
    document.documentElement.classList.add('scroll-smooth');
    return () => {
      document.documentElement.classList.remove('scroll-smooth');
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/20">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size="md" className="group-hover:scale-105 transition-transform" />
            <span className="font-bold text-lg tracking-tight">Auto Mail</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground mr-1"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-sm font-medium">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="text-sm font-medium rounded-full px-5 shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 w-full"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
            A smarter inbox <br className="hidden md:block" />
            <span className="text-primary">for your work.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop spending hours organizing and reading emails. Auto Mail automatically sorts your messages, writes quick summaries, and helps you reply faster.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base font-medium rounded-full shadow-md hover:shadow-lg transition-all">
                Try it for free
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium rounded-full border-border/50 hover:bg-muted/50 group">
                <PlayCircle className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-foreground transition-colors" />
                See how it works
              </Button>
            </Link>
          </div>
        </motion.div>

      </section>

      {/* Features Section (Bento Style) */}
      <section id="features" className="py-24 px-6 bg-muted/10 border-t border-border/30">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything works automatically</h2>
            <p className="text-muted-foreground text-lg">
              We handle the messy parts of email so you don't have to. Connect your account once, and watch your inbox organize itself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between group hover:border-border transition-colors">
              <div className="space-y-4 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Automatic Folders</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Receipts go to Finance, newsletters group together, and important work emails stay front and center. You never have to drag-and-drop an email again.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between group hover:border-border transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Find Anything Instantly</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ask questions like "When is my flight?" and get the exact answer immediately.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between group hover:border-border transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <PenTool className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Quick Replies</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate professional, ready-to-send responses in one click, perfectly matching the conversation's tone.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between group hover:border-border transition-colors">
              <div className="space-y-4 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Read Less, Know More</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Long, messy email chains are instantly boiled down into a two-sentence summary. You get the gist immediately without scrolling.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between group hover:border-border transition-colors">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Your Data is Yours</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Secure access. We don't read your emails or use them to train public models.
                </p>
              </div>
            </div>
            
            <div className="md:col-span-2 p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between group hover:border-border transition-colors">
              <div className="space-y-4 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">Always Up to Date</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We stay perfectly synced with your Gmail account in the background. If you read or delete an email here, it updates there.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border/30 bg-background text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="font-semibold text-foreground">Auto Mail</span>
          </div>
          
          <div className="text-muted-foreground">
            Built for the <strong className="text-foreground font-medium">Repeatless Assignment</strong>.
          </div>

          <div className="flex items-center gap-6 text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
