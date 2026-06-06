import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export function PaymentMethodCard({
  title,
  description,
  icon,
  selected,
  onClick
}: {
  title: string;
  description: string;
  icon: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('group relative w-full rounded-2xl border p-4 text-left transition-all hover:-translate-y-1 hover:border-theater-gold/45 hover:bg-theater-gold/10', selected ? 'border-theater-gold/55 bg-theater-gold/12 shadow-glow' : 'border-white/10 bg-white/[.045]')}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black/30 text-theater-gold transition-transform group-hover:scale-110">{icon}</span>
        <span className="min-w-0">
          <span className="block font-semibold text-white">{title}</span>
          <span className="mt-1 block text-sm text-white/55">{description}</span>
        </span>
      </div>
      {selected && <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-theater-gold text-theater-black"><Check size={14} /></span>}
    </button>
  );
}
