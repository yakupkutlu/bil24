import { motion } from 'framer-motion';
import { Banknote, CheckCircle2, ClipboardCheck, Hourglass, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Refund } from '@/types';
import { money } from '@/utils/formatters';

const flow = [
  { key: 'REQUESTED', label: 'Talep edildi', icon: ClipboardCheck },
  { key: 'APPROVED', label: 'Onaylandı', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'İşleniyor', icon: Hourglass },
  { key: 'REFUNDED', label: 'İade edildi', icon: Banknote }
];

const order = ['REQUESTED', 'APPROVED', 'PROCESSING', 'REFUNDED'];

export function RefundFlowCard({ refund, index = 0 }: { refund: Refund; index?: number }) {
  const currentIndex = refund.status === 'REJECTED' || refund.status === 'FAILED' ? -1 : order.indexOf(refund.status);
  const failed = refund.status === 'REJECTED' || refund.status === 'FAILED';

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-5"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Badge>{refund.status}</Badge><span className="text-sm text-white/45">{refund.refundNumber}</span></div>
          <h3 className="mt-3 font-serif text-2xl text-white">{money(refund.amount)} refund request</h3>
          <p className="mt-1 text-sm text-white/55">{refund.reason}</p>
        </div>
        {failed && <span className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-sm text-red-100"><XCircle size={14} className="mr-1 inline" /> İnceleme gerekli</span>}
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {flow.map((step, stepIndex) => {
          const Icon = step.icon;
          const active = currentIndex >= stepIndex;
          return (
            <div key={step.key} className={`rounded-2xl border p-4 ${active ? 'border-theater-gold/35 bg-theater-gold/10 text-theater-ivory' : 'border-white/10 bg-black/20 text-white/35'}`}>
              <Icon className={active ? 'text-theater-gold' : 'text-white/35'} size={20} />
              <p className="mt-3 text-sm font-medium">{step.label}</p>
            </div>
          );
        })}
      </div>
    </motion.article>
  );
}
