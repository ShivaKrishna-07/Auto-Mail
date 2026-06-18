'use client';

import React, { useState, useEffect } from 'react';
import { useDraftComposeMutation, useSendEmailMutation } from '../hooks/useCompose';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  PenTool
} from 'lucide-react';

export function ComposePage() {
  // AI draft assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [userContext, setUserContext] = useState('');

  // Email form states
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // React Query Mutations
  const draftComposeMutation = useDraftComposeMutation();
  const sendEmailMutation = useSendEmailMutation();

  // Dynamic document title update
  useEffect(() => {
    document.title = 'Compose Email - Auto Mail';
  }, []);

  const handleGenerateAIDraft = async () => {
    if (!aiPrompt.trim()) return;
    
    draftComposeMutation.mutate(
      { prompt: aiPrompt, context: userContext },
      {
        onSuccess: (data) => {
          const aiResult = data.draft;
          let parsedSubject = '';
          let parsedBody = aiResult;

          const subjectMatch = aiResult.match(/^Subject:\s*(.*)/i);
          if (subjectMatch) {
            parsedSubject = subjectMatch[1];
            parsedBody = aiResult.replace(/^Subject:\s*.*\n*/i, '').trim();
          }

          setSubject(parsedSubject);
          setBody(parsedBody);
        },
        onError: (err) => {
          console.error('Failed to generate draft compose:', err);
        }
      }
    );
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body) return;

    // Convert newlines to html linebreaks for backend MIME dispatch
    const formattedBody = body.replace(/\n/g, '<br/>');

    sendEmailMutation.mutate(
      { to, subject, body: formattedBody },
      {
        onSuccess: () => {
          // Clear fields on success
          setTo('');
          setSubject('');
          setBody('');
          setAiPrompt('');
          setUserContext('');
        },
        onError: (err) => {
          console.error('Failed to dispatch email:', err);
        }
      }
    );
  };

  return (
    <div className="flex-1 flex h-full min-w-0 overflow-hidden bg-background transition-colors duration-300">
      {/* Dual Panel Layout */}
      {/* Pane 1: AI Assistant */}
      <div className="w-[28rem] border-r border-border p-6 space-y-6 overflow-y-auto bg-card/10 shrink-0">
        <div className="space-y-1">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" /> AI Draft Assistant
          </span>
          <h2 className="text-sm font-bold text-muted-foreground">Let Gemini build your email template</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
              Prompt Instructions
            </label>
            <Textarea
              placeholder="What is this email about? (e.g. 'write a polite thank you email to shiva for the interview, stating I look forward to hearing back')"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={draftComposeMutation.isPending}
              className="text-xs min-h-[6rem] bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
              Background Context (Optional)
            </label>
            <Textarea
              placeholder="Additional background context, project details, or formatting directions..."
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              disabled={draftComposeMutation.isPending}
              className="text-xs min-h-[5rem] bg-background border-border"
            />
          </div>

          <Button
            onClick={handleGenerateAIDraft}
            disabled={draftComposeMutation.isPending || !aiPrompt.trim()}
            className="w-full py-5 text-xs font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {draftComposeMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Drafting Email...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Draft Email with Gemini
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Pane 2: Email Composer Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <PenTool className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-base font-bold tracking-tight">New Message Editor</h1>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="grid grid-cols-6 gap-2 items-center">
              <label className="text-xs font-semibold text-muted-foreground col-span-1">To:</label>
              <Input
                type="email"
                required
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={sendEmailMutation.isPending}
                className="col-span-5 text-xs bg-card/40 border-border"
              />
            </div>

            <div className="grid grid-cols-6 gap-2 items-center">
              <label className="text-xs font-semibold text-muted-foreground col-span-1">Subject:</label>
              <Input
                type="text"
                required
                placeholder="Enter Subject line"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sendEmailMutation.isPending}
                className="col-span-5 text-xs bg-card/40 border-border font-medium"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <label className="text-xs font-semibold text-muted-foreground">Message Body:</label>
              <Textarea
                required
                placeholder="Write your email body here or let the AI Draft Assistant generate it..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sendEmailMutation.isPending}
                className="text-xs min-h-[16rem] bg-card/30 border-border leading-relaxed"
              />
            </div>

            {sendEmailMutation.isSuccess && (
              <div className="p-3 text-xs rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Message dispatched successfully!</span>
              </div>
            )}

            {sendEmailMutation.isError && (
              <div className="p-3 text-xs rounded-xl border border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Error: {(sendEmailMutation.error as any)?.message || 'Failed to dispatch email.'}</span>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border/60">
              <Button
                type="submit"
                disabled={sendEmailMutation.isPending || !to || !subject || !body}
                className="px-6 py-5 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-foreground/5 h-auto text-xs"
              >
                {sendEmailMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Email
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
