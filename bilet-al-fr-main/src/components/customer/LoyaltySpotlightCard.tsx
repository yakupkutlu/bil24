import { motion } from 'framer-motion';
import { Crown, Gift, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function LoyaltySpotlightCard() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-theater-gold/15 blur-3xl" />
      <CardContent className="relative space-y-5 p-6">
        <div className="flex items-center justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-theater-gold text-theater-black"><Crown /></span>
          <span className="rounded-full border border-theater-gold/25 bg-theater-gold/10 px-3 py-1 text-xs text-theater-ivory">Gold guest</span>
        </div>
        <div>
          <p className="text-theater-gold">Tiatru Club</p>
          <h2 className="mt-1 font-serif text-2xl text-white">2 shows away from your next reward.</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">Collect unforgettable nights and unlock early seat access, surprise discounts, and premium balcony invitations.</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <motion.span key={index} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: index * 0.08 }} className={`h-2 origin-left rounded-full ${index < 3 ? 'bg-theater-gold' : 'bg-white/10'}`} />
          ))}
        </div>
        <Button variant="outline" className="w-full"><Gift size={16} /> Görüntüle rewards</Button>
        <Sparkles className="absolute bottom-8 right-8 text-theater-gold/45" />
      </CardContent>
    </Card>
  );
}
