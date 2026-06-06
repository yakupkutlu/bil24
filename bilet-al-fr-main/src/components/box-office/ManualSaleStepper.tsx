import { Check, CreditCard, ScanBarcode, UserRound } from 'lucide-react';
import { cn } from '@/utils/cn';

const steps = [
  { label: 'Koltuk seç', icon: <ScanBarcode size={16} /> },
  { label: 'Müşteri bilgileri', icon: <UserRound size={16} /> },
  { label: 'Ödeme', icon: <CreditCard size={16} /> },
  { label: 'Bilet yazdır', icon: <Check size={16} /> }
];

export function ManualSaleStepper({ active = 1 }: { active?: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const isActive = index <= active;
        return (
          <div key={step.label} className={cn('rounded-2xl border p-3 text-sm transition-all', isActive ? 'border-theater-gold/40 bg-theater-gold/10 text-theater-gold' : 'border-white/10 bg-white/[.035] text-white/45')}>
            <span className="flex items-center gap-2">{step.icon}{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
