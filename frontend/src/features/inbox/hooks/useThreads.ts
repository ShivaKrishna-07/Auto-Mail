import { useQuery } from '@tanstack/react-query';
import { inboxService } from '../services/inbox.service';

export function useThreads(category?: string) {
  return useQuery({
    queryKey: ['threads', category || 'all'],
    queryFn: () => inboxService.getThreads(category),
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });
}
