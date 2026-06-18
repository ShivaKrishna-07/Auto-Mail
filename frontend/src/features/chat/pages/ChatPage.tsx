'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatSessions, useChatHistory, useAskQuestionMutation } from '../hooks/useChat';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Plus, 
  MessageSquare,
  ArrowRight,
  Mail,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';

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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  
  // RAG Sources preview panel states
  const [selectedSourceEmail, setSelectedSourceEmail] = useState<any | null>(null);
  const [fetchingSourceEmail, setFetchingSourceEmail] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic document title update
  useEffect(() => {
    document.title = 'AI Search Chat - Auto Mail';
  }, []);

  // 1. Fetch saved sessions via TanStack Query
  const { data: sessions = [], isLoading: loadingSessions, refetch: refetchSessions } = useChatSessions();

  // Auto-select first session if present
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].sessionId);
    }
  }, [sessions, currentSessionId]);

  // 2. Fetch selected session history via TanStack Query
  const { data: messages = [], isLoading: loadingMessages } = useChatHistory(currentSessionId);

  // 3. Mutation to submit query
  const askMutation = useAskQuestionMutation();

  useEffect(() => {
    // Scroll to bottom when message log changes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, askMutation.isPending]);

  const startNewSession = () => {
    setCurrentSessionId(null);
    setSelectedSourceEmail(null);
  };

  const handleQuerySend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || askMutation.isPending) return;

    const userQueryText = query;
    setQuery('');

    // Call mutation
    askMutation.mutate(
      { query: userQueryText, sessionId: currentSessionId || undefined },
      {
        onSuccess: (data) => {
          if (!currentSessionId && data.sessionId) {
            setCurrentSessionId(data.sessionId);
          }
        },
        onError: (err) => {
          console.error('Failed to ask question:', err);
        }
      }
    );
  };

  // Preview an email source context panel
  const handlePreviewSource = async (emailId: string) => {
    setFetchingSourceEmail(true);
    try {
      const match = messages.find((m: ChatMessage) => m.sources?.some((s: any) => s.id === emailId));
      const sourceMeta = match?.sources?.find((s: any) => s.id === emailId);
      
      if (sourceMeta) {
        // Fetch thread detail to extract full text body
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
            className="mx-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-primary/30 bg-primary/10 hover:bg-primary/20 text-[10px] font-bold text-primary transition-all cursor-pointer align-baseline"
            title={`Source: ${sourceObj.subject}`}
          >
            <Mail className="w-2.5 h-2.5" />
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
    <div className="flex-1 flex h-full min-w-0 overflow-hidden transition-colors duration-300">
      {/* Sidebar Panel 1: Chat Sessions */}
      <div className="w-64 border-r border-border flex flex-col h-full bg-card/20 min-w-[16rem]">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Saved Searches
          </span>
          <Button variant="ghost" size="icon" onClick={startNewSession} className="rounded-full w-7 h-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingSessions ? (
            <div className="p-4 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading logs...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-muted-foreground">
              No chat logs found. Start a new search below!
            </div>
          ) : (
            sessions.map((session: ChatSession) => (
              <Button
                key={session.sessionId}
                variant={currentSessionId === session.sessionId ? 'secondary' : 'ghost'}
                onClick={() => setCurrentSessionId(session.sessionId)}
                className="w-full justify-start text-left text-xs truncate font-medium rounded-lg h-9 gap-2 px-3"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{session.title || 'Conversation Query'}</span>
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Panel 2: Interactive Chat Stream */}
      <div className="flex-1 flex flex-col h-full bg-background min-w-0">
        <div className="p-4 border-b border-border bg-card/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <h1 className="text-sm font-bold tracking-tight">Auto Mail AI Chat (RAG)</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={startNewSession} className="text-xs flex items-center gap-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> New Session
          </Button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !askMutation.isPending ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-base font-bold">Ask Anything About Your Emails</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gemini will search your pgvector database for relevant emails, formulate answers, and cite sources automatically. Try asking:
              </p>
              <div className="w-full space-y-2 text-left pt-2">
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
                    className="w-full p-2.5 text-xs text-left rounded-xl border border-border bg-card/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 shadow-sm text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-foreground text-background font-medium'
                        : 'bg-card border border-border text-foreground'
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
                      <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block">
                          Ingested Sources Cited:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src) => (
                            <button
                              key={src.id}
                              onClick={() => handlePreviewSource(src.id)}
                              className="text-[10px] text-left px-2.5 py-1.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer max-w-xs truncate"
                              title={`Preview citation: ${src.subject}`}
                            >
                              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="truncate flex-1 font-semibold">{src.subject}</span>
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
                  <div className="max-w-2xl rounded-2xl p-4 bg-card border border-border flex items-center gap-3 text-xs text-muted-foreground shadow-sm">
                    <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    <span>Searching vector database and compiling Gemini answer...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Box */}
        <form onSubmit={handleQuerySend} className="p-4 border-t border-border bg-card/25 flex gap-2">
          <Input
            placeholder="Search and ask questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={askMutation.isPending}
            className="text-xs bg-background border-border py-5 rounded-xl flex-1"
          />
          <Button
            type="submit"
            disabled={askMutation.isPending || !query.trim()}
            className="px-5 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl flex items-center gap-2 cursor-pointer h-auto text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </Button>
        </form>
      </div>

      {/* Pane 3: Interactive Citations Preview Panel */}
      {selectedSourceEmail && (
        <div className="w-96 border-l border-border flex flex-col h-full bg-card/15 min-w-[24rem]">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" /> Cited Source Context
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSourceEmail(null)}
              className="text-[10px] px-2"
            >
              Close
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {fetchingSourceEmail ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                <span>Loading full email content...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold leading-tight">{selectedSourceEmail.subject}</h3>
                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-foreground/75" />
                      <span>From: {selectedSourceEmail.sender}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-foreground/75" />
                      <span>Date: {new Date(selectedSourceEmail.internalDate || selectedSourceEmail.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-background text-[11px] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {selectedSourceEmail.body}
                </div>

                {selectedSourceEmail.summary && (
                  <Card className="border border-primary/20 bg-primary/5 rounded-xl">
                    <CardContent className="p-3 text-[11px] leading-relaxed text-muted-foreground">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-primary block mb-1">
                        AI Ingestion Summary
                      </span>
                      {selectedSourceEmail.summary}
                    </CardContent>
                  </Card>
                )}

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      window.location.href = `/dashboard?category=${selectedSourceEmail.category || 'Professional'}`;
                    }}
                    variant="outline"
                    className="w-full text-xs font-semibold py-2 flex items-center justify-center gap-2 border-border/80 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Thread in Inbox</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
