import { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

export function TheaterBackground({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('relative min-h-screen overflow-hidden bg-theater-black text-white', className)}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(184,134,11,.22),transparent_32%),radial-gradient(circle_at_18%_22%,rgba(122,12,12,.36),transparent_32%),linear-gradient(135deg,#0B0B0D_0%,#12070A_48%,#050506_100%)]" />
        <div className="curtain-folds absolute inset-0 opacity-70" />
        <div className="spotlight-beam spotlight-beam-left" />
        <div className="spotlight-beam spotlight-beam-right" />
        <div className="floating-orb left-[8%] top-[18%] h-52 w-52 bg-theater-red/20" />
        <div className="floating-orb right-[10%] top-[12%] h-64 w-64 bg-theater-gold/10 animation-delay-1000" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="noise-overlay" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
