import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';

export function useChatSessions() {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: () => chatService.getSessions(),
    staleTime: 1000 * 60 * 1, // 1 minute stale
  });
}

export function useChatHistory(sessionId: string | null) {
  return useQuery({
    queryKey: ['chatHistory', sessionId],
    queryFn: () => chatService.getSessionHistory(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // 5 minutes stale
  });
}

export function useAskQuestionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ query, sessionId }: { query: string; sessionId?: string }) => 
      chatService.askQuestion(query, sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      queryClient.invalidateQueries({ queryKey: ['chatHistory', data.sessionId] });
    },
  });
}
