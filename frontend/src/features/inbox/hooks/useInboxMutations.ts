import { useMutation, useQueryClient } from '@tanstack/react-query';
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
