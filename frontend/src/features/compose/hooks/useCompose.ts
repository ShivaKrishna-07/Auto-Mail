import { useMutation, useQueryClient } from '@tanstack/react-query';
import { composeService } from '../services/compose.service';

export function useDraftComposeMutation() {
  return useMutation({
    mutationFn: ({ prompt, context }: { prompt: string; context?: string }) => 
      composeService.generateAIDraft(prompt, context),
  });
}

export function useSendEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ to, subject, body }: { to: string; subject: string; body: string }) => 
      composeService.sendEmail(to, subject, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}
