import React from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-20 px-6">
      
      {/* Navigation */}
      <div className="w-full max-w-5xl mb-8 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Auto Mail Demo
        </div>
      </div>

      <div className="max-w-5xl w-full text-center space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            See Auto Mail in Action
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover how our AI-powered email assistant categorizes your inbox, generates brilliant drafts, and answers questions about your email history in seconds.
          </p>
        </div>

        {/* Video Container Placeholder */}
        <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden border border-border/50 bg-card/30 shadow-2xl aspect-video group flex items-center justify-center">
          
          {/* 
            TODO: Add actual video element here. 
            Example:
            <video src="/path/to/demo.mp4" controls className="w-full h-full object-cover" />
            or
            <iframe src="https://www.youtube.com/embed/..." className="w-full h-full" allowFullScreen />
          */}
          
          <div className="absolute inset-0 bg-muted/20 backdrop-blur-[2px] transition-all group-hover:bg-muted/10" />
          
          <div className="relative z-10 flex flex-col items-center gap-4 text-muted-foreground">
            <PlayCircle className="w-20 h-20 text-primary opacity-80" />
            <p className="text-sm font-semibold tracking-wide">Video Placeholder</p>
            <p className="text-xs max-w-xs text-center opacity-80">
              The demo video will be uploaded here soon.
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-12">
          <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <span className="font-bold">1</span>
            </div>
            <h3 className="font-bold text-lg">Smart Categories</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Auto Mail analyzes incoming emails and automatically routes them to designated folders like Bills, Newsletters, or Personal.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <span className="font-bold">2</span>
            </div>
            <h3 className="font-bold text-lg">Instant AI Drafts</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Provide a brief 5-word instruction and the AI instantly generates a fully formatted, professional email reply.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <span className="font-bold">3</span>
            </div>
            <h3 className="font-bold text-lg">Semantic Search Chat</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Chat naturally with your entire inbox. "What did Sarah say about the marketing budget last week?"
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
