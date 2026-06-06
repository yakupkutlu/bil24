import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const steps = ['Koltuklar', 'Bilgiler', 'Ödeme', 'Bilet'];

export function CheckoutProgress({ active = 2 }: { active?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {steps.map((step, index) => {
        const done = index < active;
        const current = index === active;
        return (
          <div key={step} className={cn('relative overflow-hidden rounded-2xl border p-4 transition-all', current ? 'border-theater-gold/50 bg-theater-gold/12 shadow-glow' : done ? 'border-emerald-300/25 bg-emerald-400/10' : 'border-white/10 bg-white/[.045]')}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[.24em] text-white/45">Adım {index + 1}</span>
              {done && <CheckCircle2 size={16} className="text-emerald-300" />}
            </div>
            <p className={cn('mt-1 font-semibold', current ? 'text-theater-gold' : 'text-white/75')}>{step}</p>
            {current && <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-theater-gold to-transparent" />}
          </div>
        );
      })}
    </div>
  );
}
