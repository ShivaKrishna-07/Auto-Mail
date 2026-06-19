'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useThreads } from '../hooks/useThreads';
import { useThreadDetails } from '../hooks/useThreadDetails';
import { useSendReplyMutation, useDraftReplyMutation, useSummarizeThreadMutation, useCategorizeThreadMutation, useCategorizeAllMutation, useUncategorizedCountQuery } from '../hooks/useInboxMutations';
import { useAIErrorHandler } from '@/hooks/useAIErrorHandler';
import { getCategoryColor } from '@/utils/category';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  RefreshCw, 
  Sparkles, 
  Send, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Tag,
  Paperclip,
  Clock,
  MoreVertical,
  Reply
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Thread {
  id: string;
  subject: string;
  snippet: string;
  lastMessageDate: string;
  summary: string | null;
}

interface Email {
  id: string;
  sender: string;
  receiver: string;
  subject: string;
  body: string;
  html: string | null;
  internalDate: string;
  category: string;
  summary: string | null;
}

export function InboxPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const categoryFilter = searchParams.get('category');
  const queryClient = useQueryClient();
  
  const selectedThreadId = (params.threadId as string) || null;
  
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { 
    data: threadsResponse, 
    isLoading: loadingThreads, 
  } = useThreads(categoryFilter || undefined, currentPage, limit);

  const threads = threadsResponse?.data || [];
  const totalThreads = threadsResponse?.total || 0;

  const { 
    data: details = null, 
    isLoading: loadingDetails,
  } = useThreadDetails(selectedThreadId);

  const sendReplyMutation = useSendReplyMutation();
  const draftReplyMutation = useDraftReplyMutation();
  const summarizeMutation = useSummarizeThreadMutation();
  const categorizeMutation = useCategorizeThreadMutation();
  const categorizeAllMutation = useCategorizeAllMutation();
  const { data: uncategorizedCount } = useUncategorizedCountQuery();
  const { handleAIError } = useAIErrorHandler();

  useEffect(() => {
    document.title = categoryFilter ? `${categoryFilter} - Auto Mail` : 'Inbox - Auto Mail';
    setCurrentPage(1);

    // Auto-categorize trigger
    if (categoryFilter && uncategorizedCount !== undefined && uncategorizedCount > 0 && !categorizeAllMutation.isPending) {
      categorizeAllMutation.mutate(undefined, {
        onError: (err) => handleAIError(err, 'Failed to categorize remaining emails.')
      });
    }
  }, [categoryFilter, uncategorizedCount]);



  useEffect(() => {
    const handleSyncEvent = () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      if (selectedThreadId) {
        queryClient.invalidateQueries({ queryKey: ['threadDetails', selectedThreadId] });
      }
    };
    
    window.addEventListener('automail-synced', handleSyncEvent);
    return () => {
      window.removeEventListener('automail-synced', handleSyncEvent);
    };
  }, [selectedThreadId, queryClient]);

  const handleGenerateDraft = async () => {
    if (!prompt.trim() || !selectedThreadId) return;
    
    draftReplyMutation.mutate(
      { threadId: selectedThreadId, prompt },
      {
        onSuccess: (data) => {
          setDraft(data.draft);
        },
        onError: (err) => {
          console.error('Failed to generate draft reply:', err);
          handleAIError(err, 'Failed to generate draft reply.');
        }
      }
    );
  };

  const handleSendReply = async () => {
    if (!draft.trim() || !selectedThreadId) return;
    
    sendReplyMutation.mutate(
      { threadId: selectedThreadId, body: draft },
      {
        onSuccess: () => {
          setDraft('');
          setPrompt('');
        },
        onError: (err) => {
          console.error('Failed to send reply:', err);
        }
      }
    );
  };

  if (categorizeAllMutation.isPending && categoryFilter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-background relative z-50">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <h2 className="text-[20px] font-bold text-foreground mb-2">Categorizing your inbox...</h2>
        <p className="text-muted-foreground text-[14px]">
          Our AI is organizing {uncategorizedCount} remaining emails.
        </p>
        <div className="mt-8 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full min-w-0 bg-background overflow-hidden">
      {/* Pane 1: Threads List (Column 2 in Dashboard) */}
      <div className="w-[380px] shrink-0 border-r border-border flex flex-col h-full bg-sidebar/30">
        <div className="h-16 border-b border-border flex items-center justify-between px-5 shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
            {categoryFilter ? `${categoryFilter}` : 'Inbox'}
          </h2>
          
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground font-medium mr-2">
              {totalThreads > 0 ? `${(currentPage - 1) * limit + 1}-${Math.min(currentPage * limit, totalThreads)} of ${totalThreads}` : ''}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground hover:text-foreground" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground hover:text-foreground" 
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage * limit >= totalThreads}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingThreads ? (
            <div className="p-8 text-center text-[13px] text-muted-foreground flex flex-col items-center gap-3">
              <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              <span>Loading mails...</span>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-muted-foreground flex flex-col items-center gap-3">
              <Mail className="w-8 h-8 text-muted-foreground/30" />
              <span>Your inbox is empty.</span>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {threads.map((thread: Thread) => {
                const date = new Date(thread.lastMessageDate);
                const isSelected = selectedThreadId === thread.id;

                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      const q = searchParams.toString();
                      router.push(`/dashboard/${thread.id}${q ? `?${q}` : ''}`);
                    }}
                    className={`group relative p-4 flex flex-col gap-1.5 cursor-pointer transition-all duration-200 ${
                      isSelected ? 'bg-secondary' : 'hover:bg-muted/40'
                    }`}
                  >
                    {isSelected && (
                      <motion.div layoutId="thread-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-foreground" />
                    )}
                    
                    <div className="flex justify-between items-start gap-3">
                      <span className={`text-[13px] font-semibold truncate flex-1 leading-tight ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                        {thread.subject || 'No Subject'}
                      </span>
                      <span className={`text-[11px] whitespace-nowrap ${isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {thread.snippet}
                    </p>
                    
                    {thread.summary && (
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="h-5 px-1.5 bg-secondary text-foreground border-none rounded-[6px] gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-muted-foreground" /> AI Summary
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pane 2: Reading Panel & Workspace (Column 3 in Dashboard) */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background relative overflow-y-auto custom-scrollbar">
        {loadingDetails ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
            </div>
            <span className="text-[13px] text-muted-foreground font-medium">Loading thread workspace...</span>
          </div>
        ) : details ? (
          <div className="p-8 max-w-4xl mx-auto w-full space-y-8 pb-32">
            
            {/* 1. Header & Metadata Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-[24px] font-bold leading-tight text-foreground">
                  {details.thread.subject ? details.thread.subject.charAt(0).toUpperCase() + details.thread.subject.slice(1) : 'No Subject'}
                </h1>
                <div className="flex items-center gap-3 shrink-0">
                  {details.emails[0]?.category && details.emails[0]?.category !== 'Uncategorized' && (
                    <Badge className={getCategoryColor(details.emails[0]?.category) + " shrink-0 shadow-none px-2 h-6 text-[11px]"}>
                      {details.emails[0]?.category}
                    </Badge>
                  )}
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-8 text-[12px] font-semibold gap-2 shadow-sm" 
                    onClick={() => {
                      // Navigate to compose prefilled
                      // Find the first email not sent by the user (checking labelIds for 'SENT')
                      const receivedEmail = details.emails.slice().reverse().find((e: any) => !e.labelIds?.includes('SENT'));
                      const rawSender = receivedEmail ? receivedEmail.sender : (details.emails[0]?.receiver || '');
                      const extractEmail = (str: string) => {
                        const match = str.match(/<([^>]+)>/);
                        return match ? match[1] : str.trim();
                      };
                      const replyToAddress = extractEmail(rawSender);
                      const subjectText = details.thread.subject.toLowerCase().startsWith('re:') ? details.thread.subject : 'Re: ' + details.thread.subject;
                      router.push(`/dashboard/compose?threadId=${details.thread.id}&to=${encodeURIComponent(replyToAddress)}&subject=${encodeURIComponent(subjectText)}`);
                    }}
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Reply in this thread
                  </Button>
                </div>
              </div>

            </div>

            {/* 2. AI Thread Summary Card */}
            {(!details.thread.summary || details.thread.summary.includes('Failed to generate') || details.thread.summary.trim() === '') ? (
              <Card className="bg-secondary/10 border border-dashed border-border shadow-none overflow-hidden flex flex-col items-center justify-center p-8 gap-3">
                <Sparkles className="w-6 h-6 text-muted-foreground/50" />
                <p className="text-[13px] text-muted-foreground text-center max-w-sm">
                  This thread hasn't been summarized yet. Generate an AI executive summary to quickly understand the context.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2 text-[12px] h-8 font-semibold gap-2 shadow-sm"
                  onClick={() => summarizeMutation.mutate(details.thread.id, {
                    onError: (err) => handleAIError(err, 'Failed to generate summary')
                  })}
                  disabled={summarizeMutation.isPending}
                >
                  {summarizeMutation.isPending ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing thread...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Generate Summary</>
                  )}
                </Button>
              </Card>
            ) : (
              <Card className="bg-secondary/30 border border-border shadow-none overflow-hidden">
                <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2 bg-secondary/30">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[12px] font-bold text-foreground uppercase tracking-wider">Executive Summary</span>
                </div>
                <div className="p-5 text-[14px] leading-relaxed text-foreground/90">
                  {details.thread.summary}
                </div>
              </Card>
            )}

            {/* 3. Conversation Thread */}
            <div className="space-y-4 relative">
              {/* Vertical connecting line */}
              {details.emails.length > 1 && (
                <div className="absolute left-[23px] top-10 bottom-10 w-0.5 bg-border/50 z-0 hidden sm:block"></div>
              )}
              
              {details.emails.map((email: Email, idx: number) => (
                <div key={email.id} className="relative z-10 flex gap-4">
                  
                  {/* Timeline Avatar */}
                  {details.emails.length > 1 && (
                    <div className="hidden sm:flex flex-col items-center pt-3">
                      <div className="w-10 h-10 rounded-full bg-background border-2 border-border flex items-center justify-center shrink-0 font-bold text-[14px] text-foreground z-10 shadow-sm">
                        {email.sender.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  {/* Message Card */}
                  <Card className="flex-1 shadow-sm overflow-hidden bg-card border-border/40 hover:border-border/80 transition-colors">
                    <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between bg-secondary/10">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 font-bold text-[12px] text-muted-foreground ${details.emails.length > 1 ? 'sm:hidden' : ''}`}>
                          {email.sender.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-foreground leading-tight">{email.sender}</span>
                          <span className="text-[12px] text-muted-foreground">to {email.receiver}</span>
                        </div>
                      </div>
                      <span className="text-[12px] text-muted-foreground font-medium">
                        {new Date(email.internalDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="p-0">
                      {email.html ? (
                        <div className="bg-white">
                          <iframe
                            srcDoc={email.html}
                            sandbox="allow-popups allow-same-origin"
                            className="w-full min-h-[300px] border-none block"
                            onLoad={(e) => {
                              const iframe = e.target as HTMLIFrameElement;
                              if (iframe.contentWindow) {
                                iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 50 + 'px';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="p-6 text-[14px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                          {email.body}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>



          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center">
              <Mail className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[16px] text-foreground">No Thread Selected</span>
              <span className="text-[14px] text-muted-foreground max-w-[250px]">Select an email thread from the list to view the conversation and AI workspace.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
