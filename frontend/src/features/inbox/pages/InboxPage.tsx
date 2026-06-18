'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useThreads } from '../hooks/useThreads';
import { useThreadDetails } from '../hooks/useThreadDetails';
import { useSendReplyMutation, useDraftReplyMutation } from '../hooks/useInboxMutations';
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
  Eye,
  CheckCircle2
} from 'lucide-react';

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
  const categoryFilter = searchParams.get('category');
  const queryClient = useQueryClient();
  
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  
  // AI draft prompt instructions state
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState('');
  
  // HTML email view toggle state
  const [activeHtmlViewEmailId, setActiveHtmlViewEmailId] = useState<string | null>(null);

  // 1. Fetch Thread list using React Query
  const { 
    data: threads = [], 
    isLoading: loadingThreads, 
    refetch: refetchThreads 
  } = useThreads(categoryFilter || undefined);

  // 2. Fetch Selected Thread Details using React Query
  const { 
    data: details = null, 
    isLoading: loadingDetails,
    refetch: refetchDetails
  } = useThreadDetails(selectedThreadId);

  // 3. React Query Mutations
  const sendReplyMutation = useSendReplyMutation();
  const draftReplyMutation = useDraftReplyMutation();

  // Dynamic document title update
  useEffect(() => {
    document.title = categoryFilter ? `${categoryFilter} - Auto Mail` : 'Inbox - Auto Mail';
  }, [categoryFilter]);

  // Set default selection when threads are loaded
  useEffect(() => {
    if (threads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  useEffect(() => {
    // Listen to manual sync triggers from Sidebar
    const handleSyncEvent = () => {
      // Invalidate queries to refresh lists and details
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

  return (
    <div className="flex-1 flex h-full min-w-0 overflow-hidden transition-colors duration-300">
      {/* Pane 1: Threads List */}
      <div className="w-96 border-r border-border flex flex-col h-full bg-card/20 min-w-[24rem]">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold tracking-tight">
              {categoryFilter ? `${categoryFilter} Threads` : 'All Conversations'}
            </h2>
            <span className="text-[10px] text-muted-foreground">
              {threads.length} conversations found
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetchThreads()} className="rounded-full">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingThreads ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {loadingThreads ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span>Loading email threads...</span>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No threads found. Click 'Sync Now' in the sidebar to load recent messages.
            </div>
          ) : (
            threads.map((thread: Thread) => {
              const date = new Date(thread.lastMessageDate);
              const formattedDate = date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-4 flex flex-col gap-1.5 cursor-pointer hover:bg-muted/40 transition-colors ${
                    selectedThreadId === thread.id ? 'bg-muted/65 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold truncate flex-1 leading-tight">
                      {thread.subject}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formattedDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {thread.snippet}
                  </p>
                  {thread.summary && (
                    <div className="inline-flex items-center gap-1 text-[9px] text-primary/80 font-medium">
                      <Sparkles className="w-2.5 h-2.5" /> AI Summarized
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pane 2: Thread Conversation details */}
      <div className="flex-1 flex flex-col h-full bg-background min-w-0">
        {loadingDetails ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Retrieving messages and generating thread context...</span>
          </div>
        ) : details ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Thread Header */}
            <div className="p-4 border-b border-border bg-card/10 flex flex-col gap-1">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-base font-bold leading-tight flex-1">
                  {details.thread.subject}
                </h1>
                <Badge className={getCategoryColor(details.emails[0]?.category)}>
                  {details.emails[0]?.category}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> 
                First Email: {new Date(details.emails[0]?.internalDate).toLocaleString()}
              </span>
            </div>

            {/* Main conversation section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Gemini Unified Thread Summary Card */}
              {details.thread.summary && (
                <Card className="border border-primary/20 bg-primary/5 rounded-xl">
                  <CardHeader className="py-3 px-4 flex flex-row items-center gap-2 border-b border-primary/10">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">
                      AI Thread Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-3 px-4 text-xs leading-relaxed">
                    {details.thread.summary}
                  </CardContent>
                </Card>
              )}

              {/* Message History */}
              <div className="space-y-4 pt-2">
                {details.emails.map((email: Email) => {
                  const isHtmlViewerActive = activeHtmlViewEmailId === email.id;

                  return (
                    <Card key={email.id} className="border border-border/60 bg-card/45 shadow-sm rounded-xl overflow-hidden">
                      <CardHeader className="py-3 px-4 bg-muted/20 flex flex-row items-center justify-between border-b border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold truncate max-w-xs">{email.sender}</span>
                            <span className="text-[9px] text-muted-foreground">To: {email.receiver}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(email.internalDate).toLocaleString()}
                          </span>
                          {email.html && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setActiveHtmlViewEmailId(isHtmlViewerActive ? null : email.id)}
                              className="w-7 h-7 rounded-full"
                              title="Toggle Original HTML view"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 text-xs leading-relaxed">
                        {isHtmlViewerActive && email.html ? (
                          <div className="border border-border rounded-lg overflow-hidden bg-white">
                            <iframe
                              srcDoc={email.html}
                              sandbox="allow-popups"
                              className="w-full h-96 border-none"
                            />
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{email.body}</div>
                        )}

                        {/* Message Individual Summary */}
                        {email.summary && (
                          <div className="mt-4 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground flex flex-col gap-0.5">
                            <span className="font-bold text-[9px] uppercase tracking-wider text-foreground/80 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-primary" /> Message Summary
                            </span>
                            {email.summary}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* AI Reply Builder and Compose Form */}
            <div className="p-4 border-t border-border bg-card/20 space-y-3">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Reply with Auto Mail Assistant
                  </span>
                  {draftReplyMutation.isPending && <span className="text-[10px] text-muted-foreground">Drafting reply...</span>}
                </div>
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Provide reply instructions (e.g., 'agree to meet on Monday, say I will send details')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={draftReplyMutation.isPending}
                    className="text-xs min-h-[4rem] bg-background/50 border-border"
                  />
                  <Button
                    onClick={handleGenerateDraft}
                    disabled={draftReplyMutation.isPending || !prompt.trim()}
                    className="px-4 text-xs flex flex-col justify-center items-center gap-1.5 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground h-auto rounded-xl cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Draft</span>
                  </Button>
                </div>
              </div>

              {/* Draft Editing Box */}
              {(draft || sendReplyMutation.isSuccess) && (
                <div className="space-y-2 pt-1">
                  {sendReplyMutation.isSuccess ? (
                    <div className="p-3 text-xs rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Reply sent successfully! Syncing thread changes...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        Review AI Generated Draft (Editable)
                      </div>
                      <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        disabled={sendReplyMutation.isPending}
                        className="text-xs min-h-[8rem] bg-background border-border"
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setDraft('')}
                          className="text-xs cursor-pointer"
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={handleSendReply}
                          disabled={sendReplyMutation.isPending || !draft.trim()}
                          size="sm"
                          className="text-xs font-bold flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                        >
                          {sendReplyMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Send Response
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground gap-2">
            <AlertCircle className="w-8 h-8 text-muted-foreground/60" />
            <span>Select an email thread from the list to view the conversation details and draft replies.</span>
          </div>
        )}
      </div>
    </div>
  );
}
