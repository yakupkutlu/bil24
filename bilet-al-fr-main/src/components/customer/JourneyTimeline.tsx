import { motion } from 'framer-motion';
import { Armchair, CheckCircle2, CreditCard, QrCode, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

const steps = [
  { title: 'Koltuk seçildi', text: 'Salondaki favori yerin yolculuğuna kaydedildi.', icon: Armchair },
  { title: 'Ödeme onaylandı', text: 'Güvenli ödeme tamamlandı ve siparişin koruma altında.', icon: CreditCard },
  { title: 'QR bilet hazır', text: 'Giriş QR kodun gösteri gecesi için hazır.', icon: QrCode },
  { title: 'Perde anı', text: 'Gel, QR kodunu okut ve performansın tadını çıkar.', icon: Sparkles }
];

export function JourneyTimeline() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-theater-gold">Journey</p>
            <h2 className="font-serif text-2xl text-white">Your next theater night</h2>
          </div>
          <CheckCircle2 className="text-theater-gold" />
        </div>
        <div className="relative space-y-4">
          <div className="absolute left-5 top-7 h-[calc(100%-3.5rem)] w-px bg-gradient-to-b from-theater-gold via-theater-red to-transparent" />
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
                className="relative flex gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
              >
                <span className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-theater-gold/35 bg-theater-black text-theater-gold shadow-glow"><Icon size={18} /></span>
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/55">{step.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
