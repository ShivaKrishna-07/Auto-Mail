import { useQuery } from '@tanstack/react-query';
import { inboxService } from '../services/inbox.service';

export function useThreadDetails(threadId: string | null) {
  return useQuery({
    queryKey: ['threadDetails', threadId],
    queryFn: () => inboxService.getThreadDetails(threadId!),
    enabled: !!threadId,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });
}
