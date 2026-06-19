import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inboxService } from '../services/inbox.service';

export function useSendReplyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) => 
      inboxService.sendReply(threadId, body),
    onSuccess: (data, variables) => {
      // Invalidate caches to trigger auto-reloads
      queryClient.invalidateQueries({ queryKey: ['threadDetails', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}

export function useDraftReplyMutation() {
  return useMutation({
    mutationFn: ({ threadId, prompt }: { threadId: string; prompt: string }) => 
      inboxService.generateAIDraft(threadId, prompt),
  });
}

export function useSummarizeThreadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => inboxService.summarizeThread(threadId),
    onSuccess: (data, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['threadDetails', threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}

export function useCategorizeThreadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => inboxService.categorizeThread(threadId),
    onSuccess: (data, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['threadDetails', threadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}

export function useUncategorizedCountQuery() {
  return useQuery({
    queryKey: ['uncategorizedCount'],
    queryFn: () => inboxService.getUncategorizedCount(),
  });
}

export function useCategorizeAllMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => inboxService.categorizeAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['uncategorizedCount'] });
      queryClient.invalidateQueries({ queryKey: ['threadDetails'] });
    },
  });
}
