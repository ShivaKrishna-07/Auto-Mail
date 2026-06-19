'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useChatSessions, useChatHistory, useAskQuestionMutation } from '../hooks/useChat';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, MessageSquare, ExternalLink, Bot, Check, Search, Sparkles, Send, RefreshCw, FileText, ArrowRight, Mail, User, Calendar } from 'lucide-react';
import { useAIErrorHandler } from '@/hooks/useAIErrorHandler';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: Array<{
    id: string;
    threadId: string;
    sender: string;
    subject: string;
    internalDate: string;
    category: string;
  }> | null;
  createdAt: string;
}

interface ChatSession {
  sessionId: string;
  title: string | null;
  lastActive: string;
}

export function ChatPage() {
  const queryClient = useQueryClient();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentSessionId = (params.chatId as string) || null;
  const [query, setQuery] = useState('');
  
  const [selectedSourceEmail, setSelectedSourceEmail] = useState<any | null>(null);
  const [fetchingSourceEmail, setFetchingSourceEmail] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'AI Search Chat - Auto Mail';
  }, []);

  const { data: sessions = [], isLoading: loadingSessions, refetch: refetchSessions } = useChatSessions();

  const { data: messages = [], isLoading: loadingMessages } = useChatHistory(currentSessionId);

  const askMutation = useAskQuestionMutation();
  const { handleAIError } = useAIErrorHandler();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, askMutation.isPending]);

  const startNewSession = () => {
    router.push('/dashboard/chat');
    setSelectedSourceEmail(null);
  };

  const handleQuerySend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || askMutation.isPending) return;

    const userQueryText = query;
    setQuery('');

    askMutation.mutate(
      { query: userQueryText, sessionId: currentSessionId || undefined },
      {
        onSuccess: (data) => {
          if (!currentSessionId && data.sessionId) {
            router.push(`/dashboard/chat/${data.sessionId}`);
          }
        },
        onError: (err) => {
          console.error('Failed to ask question:', err);
          handleAIError(err, 'Failed to send message.');
        }
      }
    );
  };

  const handlePreviewSource = async (emailId: string) => {
    setFetchingSourceEmail(true);
    try {
      const match = messages.find((m: ChatMessage) => m.sources?.some((s: any) => s.id === emailId));
      const sourceMeta = match?.sources?.find((s: any) => s.id === emailId);
      
      if (sourceMeta) {
        const threadDetails = await api.get(`/api/emails/threads/${sourceMeta.threadId}`);
        const emailDetail = threadDetails.emails.find((e: any) => e.id === emailId);
        setSelectedSourceEmail(emailDetail || sourceMeta);
      }
    } catch (e) {
      console.error('Failed to preview email source:', e);
    } finally {
      setFetchingSourceEmail(false);
    }
  };

  const renderMessageContent = (content: string, sources: any[] | null) => {
    if (!sources || sources.length === 0) return <p className="whitespace-pre-wrap">{content}</p>;

    const regex = /\[([a-f0-9]{16})\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const matchIndex = match.index;
      const emailId = match[1];

      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }

      const sourceObj = sources.find(s => s.id === emailId);

      if (sourceObj) {
        parts.push(
          <button
            key={emailId + '-' + matchIndex}
            onClick={() => handlePreviewSource(emailId)}
            className="mx-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-secondary hover:bg-muted text-[11px] font-bold text-foreground transition-colors cursor-pointer align-baseline"
            title={`Source: ${sourceObj.subject}`}
          >
            <Mail className="w-3 h-3" />
            <span>Ref</span>
          </button>
        );
      } else {
        parts.push(match[0]);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return <div className="whitespace-pre-wrap">{parts}</div>;
  };

  return (
    <div className="flex-1 flex h-full min-w-0 bg-background overflow-hidden relative">
      
      {/* Sidebar Panel 1: Chat Sessions */}
      <div className="w-[300px] border-r border-border flex flex-col h-full bg-sidebar/30 shrink-0">
        <div className="h-16 border-b border-border flex justify-between items-center px-5 shrink-0 bg-background/50 backdrop-blur-md">
          <span className="text-[13px] font-semibold text-foreground tracking-tight">
            Chat History
          </span>
          <Button variant="ghost" size="icon" onClick={startNewSession} className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {loadingSessions ? (
            <div className="p-4 text-center text-[12px] text-muted-foreground flex flex-col justify-center items-center gap-3">
              <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              <span>Loading history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-[12px] text-muted-foreground flex flex-col items-center gap-2">
              <MessageSquare className="w-6 h-6 text-muted-foreground/30" />
              No chat logs found.
            </div>
          ) : (
            sessions.map((session: ChatSession) => (
              <Button
                key={session.sessionId}
                variant={currentSessionId === session.sessionId ? 'secondary' : 'ghost'}
                onClick={() => router.push(`/dashboard/chat/${session.sessionId}`)}
                className={`w-full justify-start text-left text-[13px] truncate font-medium rounded-[8px] h-10 gap-3 px-3 transition-colors ${
                  currentSessionId === session.sessionId ? 'bg-secondary text-foreground hover:bg-muted' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1">{session.title || 'Conversation Query'}</span>
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Panel 2: Interactive Chat Stream */}
      <div className="flex-1 flex flex-col h-full bg-background min-w-0 relative">
        <div className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <h1 className="text-[15px] font-semibold tracking-tight text-foreground">Smart Search Assistant</h1>
          </div>
          <Button variant="outline" size="sm" onClick={startNewSession} className="text-[12px] font-semibold flex items-center gap-2 px-4 shadow-sm border-border/80 bg-background hover:bg-muted/50">
            <Plus className="w-3.5 h-3.5" /> New Chat
          </Button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-[140px]">
          {messages.length === 0 && !askMutation.isPending ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto space-y-6">
              <div className="w-16 h-16 rounded-[16px] bg-secondary flex items-center justify-center text-foreground shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-[20px] font-bold text-foreground">Ask anything about your emails</h2>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Our smart search helps you find relevant emails, formulates accurate answers, and cites its sources.
                </p>
              </div>
              
              <div className="w-full grid gap-3 pt-4">
                {[
                  "What did my manager say about the deadline?",
                  "Find all flight booking receipts and summaries.",
                  "Summarize latest updates from professional category.",
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(q);
                    }}
                    className="w-full p-4 text-[13px] font-medium text-left rounded-[12px] border border-border bg-card hover:bg-muted/40 hover:border-border/80 text-foreground transition-all flex items-center justify-between gap-4 shadow-sm group"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 max-w-3xl mx-auto py-8">
              {messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[16px] px-5 py-4 text-[14px] leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-foreground text-background font-medium rounded-tr-[4px]'
                        : 'bg-card border border-border/80 text-foreground rounded-tl-[4px]'
                    }`}
                  >
                    {/* Render Content */}
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      renderMessageContent(msg.content, msg.sources)
                    )}

                    {/* Sources Badge List */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-border/50 space-y-3">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Sources Cited
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src) => (
                            <button
                              key={src.id}
                              onClick={() => handlePreviewSource(src.id)}
                              className="text-[12px] text-left px-3 py-2 rounded-[8px] border border-border/60 bg-muted/30 hover:bg-muted transition-all text-muted-foreground hover:text-foreground flex items-center gap-2 cursor-pointer max-w-sm truncate shadow-sm"
                              title={`Preview citation: ${src.subject}`}
                            >
                              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate flex-1 font-semibold">{src.subject || 'Unknown Subject'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {askMutation.isPending && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-[16px] rounded-tl-[4px] px-5 py-4 bg-card border border-border/80 flex items-center gap-3 text-[14px] text-muted-foreground shadow-sm">
                    <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                    <span className="font-medium">Searching emails and thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sticky Input Form Box */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-10 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <form onSubmit={handleQuerySend} className="p-2 border border-border bg-card/90 backdrop-blur-xl shadow-xl flex items-center gap-2 rounded-[16px]">
              <Input
                placeholder="Ask a question about your emails..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={askMutation.isPending}
                className="text-[14px] bg-transparent border-none focus-visible:ring-0 px-4 h-12 flex-1 shadow-none"
              />
              <Button
                type="submit"
                disabled={askMutation.isPending || !query.trim()}
                className="px-6 h-12 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-[12px] flex items-center gap-2 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Pane 3: Interactive Citations Preview Panel */}
      <AnimatePresence>
        {selectedSourceEmail && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border flex flex-col h-full bg-sidebar/30 shrink-0 overflow-hidden"
          >
            <div className="h-16 border-b border-border flex justify-between items-center px-6 shrink-0 bg-background/50 backdrop-blur-md w-[420px]">
              <span className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" /> Citation Context
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedSourceEmail(null)}
                className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 w-[420px]">
              {fetchingSourceEmail ? (
                <div className="py-12 text-center text-[13px] text-muted-foreground flex flex-col items-center gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span>Loading full email content...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-[18px] font-bold leading-tight text-foreground">{selectedSourceEmail.subject}</h3>
                    <div className="space-y-2 text-[12px] text-muted-foreground bg-card p-4 rounded-[12px] border border-border/50">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-foreground">From:</span> {selectedSourceEmail.sender}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium text-foreground">Date:</span> {new Date(selectedSourceEmail.internalDate || selectedSourceEmail.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-[12px] border border-border bg-background shadow-inner text-[13px] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
                    {selectedSourceEmail.body}
                  </div>

                  {selectedSourceEmail.summary && (
                    <Card className="border border-border bg-secondary/30 rounded-[12px] shadow-none">
                      <CardContent className="p-4 text-[13px] leading-relaxed text-foreground/80">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-foreground block mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> AI Summary
                        </span>
                        {selectedSourceEmail.summary}
                      </CardContent>
                    </Card>
                  )}

                  <div className="pt-4 border-t border-border/50">
                    <Button
                      onClick={() => {
                        window.location.href = `/dashboard?category=${selectedSourceEmail.category || 'Professional'}`;
                      }}
                      variant="secondary"
                      className="w-full text-[13px] font-semibold h-11 flex items-center justify-center gap-2 border border-border/80 shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Thread in Inbox</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
