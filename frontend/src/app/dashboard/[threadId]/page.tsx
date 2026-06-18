import { InboxPage } from '@/features/inbox/pages/InboxPage';
import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';

export default function DashboardThreadPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background text-foreground">
        <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    }>
      <InboxPage />
    </Suspense>
  );
}
