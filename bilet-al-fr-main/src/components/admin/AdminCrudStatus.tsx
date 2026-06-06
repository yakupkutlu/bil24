import { CheckCircle2, Database, Loader2, ServerCrash } from 'lucide-react';
import type { ApiResourceSource } from '@/hooks/useApiResource';

type Props = {
  source?: ApiResourceSource;
  isMutating?: boolean;
  errorMessage?: string;
  connectedLabel?: string;
};

export function AdminCrudStatus({ source, isMutating, errorMessage, connectedLabel = 'Canlı CRUD hazır' }: Props) {
  if (isMutating) {
    return <span className="inline-flex items-center gap-2 rounded-full border border-theater-gold/30 bg-theater-gold/10 px-3 py-1 text-xs text-theater-gold"><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</span>;
  }
  if (source === 'api') {
    return <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200"><CheckCircle2 size={14} /> {connectedLabel}</span>;
  }
  return <span title={errorMessage} className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs text-red-100"><ServerCrash size={14} /> Backend gerekli</span>;
}

export function AdminEndpointHint({ children }: { children: string }) {
  return <p className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-xs text-white/50"><Database size={14} className="text-theater-gold" /> {children}</p>;
}
