import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';

export function AdminMetricCard({
  title,
  value,
  icon,
  hint,
  trend,
}: {
  title: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  trend?: string;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }}>
      <Card className="relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-theater-gold/10 blur-2xl" />
        <CardContent className="relative space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">{title}</p>
              <div className="mt-2 text-2xl font-bold text-white md:text-3xl">{value}</div>
            </div>
            {icon && <span className="grid h-11 w-11 place-items-center rounded-2xl border border-theater-gold/30 bg-theater-gold/10 text-theater-gold">{icon}</span>}
          </div>
          <div className="flex items-center justify-between gap-3 text-xs">
            {hint && <p className="text-white/45">{hint}</p>}
            {trend && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 font-semibold text-emerald-200">{trend}</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
