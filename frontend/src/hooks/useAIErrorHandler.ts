import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useAIErrorHandler() {
  const router = useRouter();

  const handleAIError = (err: any, defaultMessage: string = 'Something went wrong') => {
    const errorMsg = err?.response?.data?.error || err?.message || String(err);
    
    const isQuotaError = /quota|429|exhausted|rate limit/i.test(errorMsg);

    if (isQuotaError) {
      toast.error('AI Quota Exceeded 🚦', {
        description: 'Our free AI API tier limit has been reached. Please watch the full demo instead!',
        duration: 8000,
        action: {
          label: 'Watch Demo',
          onClick: () => router.push('/demo')
        }
      });
    } else {
      toast.error(defaultMessage, {
        description: errorMsg.length < 100 ? errorMsg : undefined
      });
    }
  };

  return { handleAIError };
}
