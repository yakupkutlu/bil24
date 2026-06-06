import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, CheckCircle2, ShieldCheck, Sparkles, Ticket, type LucideIcon } from 'lucide-react';
import { EventCard } from '@/components/events/EventCard';
import { ShowtimeCard } from '@/components/events/ShowtimeCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CurtainOverlay } from '@/components/brand/CurtainOverlay';
import { SpotlightEffect } from '@/components/brand/SpotlightEffect';
import { GoldDivider } from '@/components/brand/GoldDivider';
import { AnimatedSection } from '@/components/layout/AnimatedSection';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useApiResource } from '@/hooks/useApiResource';
import { eventsService } from '@/services/events.service';
import { showtimesService } from '@/services/showtimes.service';

const benefits: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Ticket, title: 'Görsel koltuk seçimi', desc: 'Sahneye yakınlığı hissederek gerçek salon planından yerini seç.' },
  { icon: ShieldCheck, title: 'QR ile güvenli giriş', desc: 'Tekrar kullanımı engelleyen hızlı doğrulama ve personel kontrol akışı.' },
  { icon: Sparkles, title: 'Backend tabanlı satın alma', desc: 'Rezervasyon, ödeme ve bilet deneyimi gerçek API akışına bağlanır.' }
];

export function HomePage() {
  const eventsQuery = useApiResource(['home-events'], () => eventsService.list({ status: 'PUBLISHED', limit: 3 }), []);
  const showtimesQuery = useApiResource(['home-showtimes'], () => showtimesService.list({ status: 'ON_SALE', limit: 4 }), []);

  if (eventsQuery.isLoading || showtimesQuery.isLoading) return <LoadingState text="Canlı tiyatro verileri yükleniyor..." />;
  if (eventsQuery.isError) return <ErrorState title="Backend etkinlikleri yüklenemedi" text={(eventsQuery.error as Error).message} />;

  const events = eventsQuery.data?.data ?? [];
  const showtimes = showtimesQuery.data?.data ?? [];
  const heroEvent = events[0];
  const stats = [
    { value: `${showtimes.length}`, label: 'Yaklaşan seans' },
    { value: `${events.length}`, label: 'Yayındaki oyun' },
  ];

  return (
    <div>
      <section className="relative min-h-[760px] overflow-hidden">
        <SpotlightEffect />
        <CurtainOverlay />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-theater-black to-transparent" />
        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-[1.02fr_.98fr]">
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-theater-gold/40 bg-theater-gold/10 px-4 py-2 text-sm text-theater-ivory shadow-glow backdrop-blur"><Sparkles size={16} /> Backend verisiyle perde açılıyor</span>
            <h1 className="mt-7 max-w-5xl font-serif text-5xl font-bold leading-[.98] text-white md:text-7xl xl:text-8xl">Perde açılıyor. <span className="gold-text">Hikâyenin içindeki</span> koltuğunu seç.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">Bilet Al ile oyunları keşfet, seansını seç, koltuğunu backend koltuk durumuna göre ayır ve QR biletinle salona gir.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/events">Sahnedeki oyunları keşfet <ArrowRight size={18} /></Link></Button>{showtimes[0] && <Button asChild variant="outline" size="lg"><Link to={`/showtimes/${showtimes[0].id}/seats`}>Koltuk deneyimini gör</Link></Button>}</div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">{stats.map((item) => <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur"><p className="font-serif text-3xl text-theater-gold">{item.value}</p><p className="mt-1 text-xs text-white/55">{item.label}</p></div>)}</div>
          </motion.div>

          {heroEvent && <motion.div initial={{ opacity: 0, scale: 0.94, rotate: -1.5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="relative hidden lg:block">
            <div className="absolute -inset-8 rounded-[3rem] bg-theater-gold/10 blur-3xl" />
            <div className="relative rotate-2 rounded-[2.5rem] border border-theater-gold/30 bg-white/10 p-4 shadow-strongGlow backdrop-blur-xl">
              <img alt={heroEvent.title} className="h-[560px] w-full rounded-[2rem] object-cover" src={heroEvent.posterImage} />
              <div className="absolute inset-x-8 bottom-8 rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-xl"><p className="text-xs uppercase tracking-[.32em] text-theater-gold">Backendden canlı</p><h2 className="mt-2 font-serif text-3xl text-white">{heroEvent.title}</h2><p className="mt-2 text-sm text-white/62">{heroEvent.shortDescription}</p></div>
            </div>
          </motion.div>}
        </div>
      </section>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm uppercase tracking-[.35em] text-theater-gold">Bu gece sahnede</p><h2 className="mt-2 font-serif text-4xl text-white md:text-5xl">Sahnenin en büyüleyici oyunları</h2></div><Button asChild variant="secondary"><Link to="/events">Tüm etkinlikler</Link></Button></div>
        {events.length ? <div className="grid gap-6 md:grid-cols-3">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <EmptyState title="Backendden etkinlik gelmedi" text="Backend admin API içinde yayınlanmış etkinlik ekle veya seed çalıştır." />}
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr]"><Card className="relative overflow-hidden"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-theater-gold to-transparent" /><CardContent className="space-y-6 p-7"><h2 className="font-serif text-3xl text-white">Neden Bilet Al?</h2><p className="text-sm leading-6 text-white/58">Bilet Al artık etkinlik, seans, koltuk, ödeme ve bilet verilerini canlı backend üzerinden kullanacak şekilde ayarlandı.</p><GoldDivider />{benefits.map(({ icon: Icon, title, desc }) => <div className="flex gap-4" key={title}><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-theater-gold/15 text-theater-gold shadow-glow"><Icon /></div><div><p className="font-semibold text-white">{title}</p><p className="text-sm leading-6 text-white/60">{desc}</p></div></div>)}</CardContent></Card><div className="space-y-4"><div className="flex items-center gap-3 text-theater-ivory"><CalendarDays className="text-theater-gold" /><h2 className="font-serif text-3xl">Yaklaşan seanslar</h2></div>{showtimes.length ? <div className="grid gap-4">{showtimes.map((show) => <ShowtimeCard key={show.id} showtime={show} />)}</div> : <EmptyState title="Backendden seans gelmedi" text="Seans oluştur ve satışa aç." />}</div></div>
      </AnimatedSection>
    </div>
  );
}
