import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3 } from 'lucide-react';

const getRemainingSeconds = (expiresAt?: string) => {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
};

export function BookingCountdown({ expiresAt, compact = false }: { expiresAt?: string; compact?: boolean }) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(expiresAt));

  useEffect(() => {
    setRemaining(getRemainingSeconds(expiresAt));
    const timer = window.setInterval(() => setRemaining(getRemainingSeconds(expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const progress = useMemo(() => Math.max(4, Math.min(100, (remaining / 600) * 100)), [remaining]);
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const urgent = remaining <= 120;

  return (
    <div className={compact ? 'rounded-2xl border border-theater-gold/25 bg-theater-gold/10 p-4' : 'rounded-[1.7rem] border border-theater-gold/25 bg-gradient-to-br from-theater-gold/15 via-white/[.04] to-theater-red/10 p-5 shadow-glow'}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-theater-ivory">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-black/25 text-theater-gold"><Clock3 size={18} /></span>
          <div>
            <p className="text-xs uppercase tracking-[.24em] text-theater-gold">Koltuk kilidi</p>
            <p className="text-sm text-white/55">Perde açılmadan önce tamamla</p>
          </div>
        </div>
        <motion.strong
          key={`${minutes}:${seconds}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={urgent ? 'font-serif text-3xl text-red-200' : 'font-serif text-3xl text-theater-gold'}
        >
          {minutes}:{seconds}
        </motion.strong>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div className={urgent ? 'h-full rounded-full bg-red-400' : 'h-full rounded-full bg-theater-gold'} animate={{ width: `${progress}%` }} transition={{ duration: .35 }} />
      </div>
    </div>
  );
}
