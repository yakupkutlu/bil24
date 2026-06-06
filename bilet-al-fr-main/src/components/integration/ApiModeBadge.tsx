import { Wifi } from 'lucide-react';
import type { ApiResourceSource } from '@/hooks/useApiResource';
import { cn } from '@/utils/cn';

export function ApiModeBadge({ source, className }: { source?: ApiResourceSource; errorMessage?: string; className?: string }) {
  if (!source) return null;
  return <div className={cn('inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100', className)}><Wifi size={14} /> Canlı API</div>;
}
