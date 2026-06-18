import { useQuery } from '@tanstack/react-query';
import { inboxService } from '../services/inbox.service';

export function useThreads(category?: string, page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: ['threads', category || 'all', page, limit],
    queryFn: () => inboxService.getThreads(category, page, limit),
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });
}
