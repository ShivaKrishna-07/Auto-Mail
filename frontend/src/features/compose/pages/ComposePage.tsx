'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDraftComposeMutation, useSendEmailMutation } from '../hooks/useCompose';
import { useSendReplyMutation, useDraftReplyMutation } from '../../inbox/hooks/useInboxMutations';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  PenTool,
  Wand2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo,
  Redo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIErrorHandler } from '@/hooks/useAIErrorHandler';

// --- Simple Rich Text Editor Component ---
const RichTextEditor = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdating = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isUpdating.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      isUpdating.current = true;
      onChange(editorRef.current.innerHTML);
      isUpdating.current = false;
    }
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      isUpdating.current = true;
      onChange(editorRef.current.innerHTML);
      isUpdating.current = false;
    }
  };

  return (
    <div className="flex flex-col h-full border border-border/50 rounded-[12px] overflow-hidden bg-background focus-within:ring-1 focus-within:ring-border/80 transition-shadow">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border/50 p-2 bg-sidebar/50">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => exec('bold')} disabled={disabled}><Bold className="w-4 h-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => exec('italic')} disabled={disabled}><Italic className="w-4 h-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => exec('underline')} disabled={disabled}><Underline className="w-4 h-4" /></Button>
        <div className="w-[1px] h-4 bg-border/50 mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => exec('insertUnorderedList')} disabled={disabled}><List className="w-4 h-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => exec('insertOrderedList')} disabled={disabled}><ListOrdered className="w-4 h-4" /></Button>
        <div className="w-[1px] h-4 bg-border/50 mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => exec('undo')} disabled={disabled}><Undo className="w-4 h-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => exec('redo')} disabled={disabled}><Redo className="w-4 h-4" /></Button>
      </div>
      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        className="rich-text-editor flex-1 p-5 min-h-[350px] outline-none focus:ring-0 text-[14px] leading-relaxed text-foreground"
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
};

export function ComposePage() {
  // AI draft assistant states
  const [aiPrompt, setAiPrompt] = useState('');

  // Email form states
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  
  // React Query Mutations
  const draftComposeMutation = useDraftComposeMutation();
  const draftReplyMutation = useDraftReplyMutation();
  const sendEmailMutation = useSendEmailMutation();
  const sendReplyMutation = useSendReplyMutation();
  const { handleAIError } = useAIErrorHandler();

  useEffect(() => {
    document.title = 'Compose - Auto Mail';
    
    // Auto-fill from URL params (e.g. from Reply action)
    const searchParams = new URLSearchParams(window.location.search);
    const toParam = searchParams.get('to');
    const subjectParam = searchParams.get('subject');
    const threadIdParam = searchParams.get('threadId');
    if (toParam) setTo(decodeURIComponent(toParam));
    if (subjectParam) setSubject(decodeURIComponent(subjectParam));
    if (threadIdParam) setThreadId(threadIdParam);
  }, []);

  const handleGenerateAIDraft = async () => {
    if (!aiPrompt.trim()) return;
    
    const handleSuccess = (data: any) => {
      const aiResult = data.draft;
      let parsedSubject = '';
      let parsedBody = aiResult;

      const subjectMatch = aiResult.match(/^Subject:\s*(.*)/i);
      if (subjectMatch) {
        parsedSubject = subjectMatch[1];
        parsedBody = aiResult.replace(/^Subject:\s*.*\n*/i, '').trim();
      }

      if (parsedSubject && !threadId) setSubject(parsedSubject);
      
      const htmlBody = parsedBody.replace(/\n/g, '<br/>');
      setBody(htmlBody);
    };

    const handleError = (err: any) => {
      console.error('Failed to generate draft compose:', err);
      handleAIError(err, "Failed to generate AI draft.");
    };

    if (threadId) {
      draftReplyMutation.mutate(
        { threadId, prompt: aiPrompt },
        { onSuccess: handleSuccess, onError: handleError }
      );
    } else {
      draftComposeMutation.mutate(
        { prompt: aiPrompt, context: '' },
        { onSuccess: handleSuccess, onError: handleError }
      );
    }
  };

  const handleSendEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validation
    if (!to.trim()) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject.");
      return;
    }
    // Simple check to prevent empty body (strip HTML tags quickly for check)
    const strippedBody = body.replace(/<[^>]+>/g, '').trim();
    if (!strippedBody) {
      toast.error("Please enter a message body before sending.");
      return;
    }

    if (threadId) {
      sendReplyMutation.mutate(
        { threadId, body },
        {
          onSuccess: () => {
            toast.success("Reply sent successfully!");
            setTo('');
            setSubject('');
            setBody('');
            setThreadId(null);
            window.location.href = '/dashboard/inbox';
          },
          onError: (err: any) => {
            console.error('Failed to dispatch reply:', err);
            toast.error(err.message || 'Failed to send reply.');
          }
        }
      );
    } else {
      sendEmailMutation.mutate(
        { to, subject, body },
        {
          onSuccess: () => {
            toast.success("Email sent successfully!");
            setTo('');
            setSubject('');
            setBody('');
          },
          onError: (err) => {
            console.error('Failed to dispatch email:', err);
            toast.error((err as any)?.message || 'Failed to send email.');
          }
        }
      );
    }
  };

  return (
    <div className="flex-1 flex h-full min-w-0 bg-background overflow-hidden">
      
      {/* Pane 1: AI Prompt Assistant */}
      <div className="w-[380px] border-r border-border bg-sidebar/30 flex flex-col h-full shrink-0">
        <div className="h-16 border-b border-border flex items-center px-6 bg-background/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 text-foreground font-semibold text-[14px]">
            <Sparkles className="w-4 h-4 text-muted-foreground" /> AI Copilot
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 flex-1">
          <div className="space-y-1">
            <h2 className="text-[14px] font-bold text-foreground">Draft your next email</h2>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Describe what you want to say, and the assistant will generate a professional email draft for you to review and edit.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-muted-foreground/80 tracking-wider flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5" /> Instructions
              </label>
              <textarea
                placeholder="e.g. 'Write a polite thank you email to Sarah for the interview today. Reiterate my excitement for the role.'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={draftComposeMutation.isPending}
                className="w-full text-[13px] min-h-[160px] p-4 bg-background border border-border shadow-inner resize-y rounded-[12px] focus:outline-none focus:ring-1 focus:ring-foreground/20 text-foreground"
              />
            </div>

            <Button
              onClick={handleGenerateAIDraft}
              disabled={draftComposeMutation.isPending || draftReplyMutation.isPending || !aiPrompt.trim()}
              className="w-full h-11 text-[13px] font-semibold flex items-center justify-center gap-2 shadow-md transition-all rounded-[10px]"
            >
              {(draftComposeMutation.isPending || draftReplyMutation.isPending) ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating Draft...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Generate Draft
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Pane 2: Email Editor */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="h-16 border-b border-border flex items-center justify-between px-8 shrink-0 bg-background/95 backdrop-blur-sm z-10">
          <h1 className="text-[16px] font-bold tracking-tight text-foreground">
            {threadId ? "Reply in Thread" : "Compose Message"}
          </h1>
          <Button
            type="button"
            onClick={() => handleSendEmail()}
            disabled={sendEmailMutation.isPending || sendReplyMutation.isPending}
            className="px-6 h-9 bg-foreground text-background hover:bg-foreground/90 font-bold flex items-center gap-2 shadow-sm text-[13px] rounded-[8px]"
          >
            {(sendEmailMutation.isPending || sendReplyMutation.isPending) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {threadId ? "Send Reply" : "Send Message"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <Card className="p-6 bg-card shadow-sm border border-border/60 rounded-[16px]">
              <div className="space-y-6">
                
                {threadId && (
                  <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2.5 rounded-[8px] text-[13px] flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4" /> Replying to an existing email thread
                  </div>
                )}

                {/* To & Subject Fields */}
                <div className="space-y-4 border-b border-border/50 pb-6">
                  <div className="flex items-center gap-4">
                    <label className="text-[12px] font-bold text-muted-foreground w-16 uppercase tracking-wider">To</label>
                    <Input
                      type="email"
                      required
                      placeholder="recipient@example.com"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      disabled={sendEmailMutation.isPending || sendReplyMutation.isPending || !!threadId}
                      className="h-10 text-[14px] bg-background border border-border shadow-inner focus-visible:ring-1 px-4 rounded-[8px] placeholder:text-muted-foreground/50 flex-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-muted/30"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-[12px] font-bold text-muted-foreground w-16 uppercase tracking-wider">Subject</label>
                    <Input
                      type="text"
                      required
                      placeholder="Email Subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={sendEmailMutation.isPending || sendReplyMutation.isPending || !!threadId}
                      className="h-10 text-[14px] font-semibold bg-background border border-border shadow-inner focus-visible:ring-1 px-4 rounded-[8px] placeholder:text-muted-foreground/50 flex-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-muted/30"
                    />
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div className="pt-2">
                  <RichTextEditor 
                    value={body}
                    onChange={setBody}
                    disabled={sendEmailMutation.isPending || sendReplyMutation.isPending}
                  />
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
