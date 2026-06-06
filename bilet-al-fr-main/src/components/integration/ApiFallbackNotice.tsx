import { ServerCrash } from 'lucide-react';
import type { ApiResourceSource } from '@/hooks/useApiResource';

export function ApiFallbackNotice({ source, message }: { source?: ApiResourceSource; message?: string }) {
  if (source === 'api') return null;
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
      <div className="flex items-start gap-3">
        <ServerCrash className="mt-0.5 shrink-0" size={18} />
        <div>
          <p className="font-semibold">Backend verisi gerekli</p>
          <p className="mt-1 text-red-100/70">This page requires backend data. {message}</p>
        </div>
      </div>
    </div>
  );
}
