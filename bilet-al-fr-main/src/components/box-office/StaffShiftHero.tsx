import { motion } from 'framer-motion';
import { Clock3, Radio, ShieldCheck, TicketCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export function StaffShiftHero() {
  return (
    <Card className="relative overflow-hidden border-theater-gold/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(184,134,11,.22),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(122,12,12,.28),transparent_34%)]" />
      <CardContent className="relative grid gap-8 p-7 lg:grid-cols-[1.1fr_.9fr] lg:p-9">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="space-y-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[.32em] text-theater-gold"><Radio size={15} /> Canlı gişe</p>
          <div className="space-y-3">
            <h1 className="font-serif text-4xl text-white md:text-6xl">Perde açılmadan önce her şey kontrol altında.</h1>
            <p className="max-w-2xl text-base leading-8 text-white/65">Bugünkü seansları yönet, rezervasyonları ödemeye çevir, QR biletleri saniyeler içinde doğrula ve salon giriş akışını canlı tut.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild><a href="/box-office/sell-ticket">Manuel satış</a></Button>
            <Button asChild variant="outline"><a href="/box-office/verify">Tarayıcıyı aç</a></Button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .1, duration: .55 }} className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: <Clock3 />, label: 'Vardiya durumu', value: 'Açık', note: '14:00 - 23:30' },
            { icon: <TicketCheck />, label: 'Giriş akışı', value: 'Sorunsuz', note: '86 QR doğrulandı' },
            { icon: <ShieldCheck />, label: 'Çift tarama koruması', value: 'Aktif', note: 'Kullanılmış biletler engellenir' },
            { icon: <Radio />, label: 'Salon sinyali', value: 'Canlı', note: 'Büyük Sahne çevrim içi' }
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur">
              <span className="text-theater-gold">{item.icon}</span>
              <p className="mt-4 text-xs uppercase tracking-[.22em] text-white/35">{item.label}</p>
              <strong className="mt-1 block text-2xl text-white">{item.value}</strong>
              <span className="text-xs text-white/45">{item.note}</span>
            </div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}
