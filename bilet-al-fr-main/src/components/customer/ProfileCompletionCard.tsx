import { motion } from 'framer-motion';
import { Bell, Heart, Languages, ShieldCheck, UserRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

const items = [
  { label: 'Kişisel bilgiler', done: true, icon: UserRound },
  { label: 'Bildirimler', done: true, icon: Bell },
  { label: 'Favori türler', done: true, icon: Heart },
  { label: 'Tercih edilen dil', done: true, icon: Languages },
  { label: 'Şifre güvenliği', done: false, icon: ShieldCheck }
];

export function ProfileCompletionCard() {
  const done = items.filter((item) => item.done).length;
  const percent = Math.round((done / items.length) * 100);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-theater-gold">Profil</p>
            <h2 className="font-serif text-2xl text-white">Completion score</h2>
          </div>
          <span className="text-3xl font-bold text-theater-gold">{percent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-theater-red to-theater-gold" />
        </div>
        <div className="mt-5 space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <span className="flex items-center gap-3 text-sm text-white/70"><Icon size={16} className="text-theater-gold" />{item.label}</span>
                <span className={item.done ? 'text-sm text-emerald-200' : 'text-sm text-yellow-100'}>{item.done ? 'Tamamlandı' : 'İyileştir'}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
