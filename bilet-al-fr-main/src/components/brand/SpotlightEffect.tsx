import { cn } from '@/utils/cn';

export function SpotlightEffect({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <div className="absolute left-1/2 top-0 h-[520px] w-[360px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(245,232,199,.22),rgba(184,134,11,.14)_28%,transparent_68%)] blur-sm animate-spotlight-sweep" />
      <div className="absolute left-1/2 top-[38%] h-28 w-[540px] -translate-x-1/2 rounded-full bg-theater-gold/10 blur-3xl" />
    </div>
  );
}
