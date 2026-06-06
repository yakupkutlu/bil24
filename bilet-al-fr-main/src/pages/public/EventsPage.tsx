import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { EventCard } from '@/components/events/EventCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { GoldDivider } from '@/components/brand/GoldDivider';
import { eventsService } from '@/services/events.service';
import { useApiResource } from '@/hooks/useApiResource';
import { ApiModeBadge } from '@/components/integration/ApiModeBadge';

export function EventsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const eventsQuery = useApiResource(['events', { query, category, sort }], () => eventsService.list({ search: query || undefined, category: category || undefined, sort }));
  const events = eventsQuery.data?.data ?? [];
  const categories = useMemo(() => Array.from(new Set(events.map((event) => event.category).filter(Boolean))), [events]);

  if (eventsQuery.isLoading) return <LoadingState text="Canlı etkinlikler backendden yükleniyor..." />;
  if (eventsQuery.isError) return <ErrorState title="Etkinlikler yüklenemedi" text={(eventsQuery.error as Error).message} />;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.045] p-8 shadow-xl backdrop-blur md:p-10"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-theater-gold/10 blur-3xl" /><div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-theater-red/20 blur-3xl" /><motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="relative"><div className="flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-theater-gold/30 bg-theater-gold/10 px-4 py-2 text-sm text-theater-ivory"><Sparkles size={16} /> Oyunları keşfet</span></div><h1 className="mt-5 font-serif text-5xl text-white md:text-7xl">Sahnede ne var?</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-white/65">Bu sayfa sadece /api/events backend verisini kullanır.</p><div className="mt-8 grid gap-3 md:grid-cols-5"><Input className="md:col-span-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Oyun ara..." icon={<Search size={18} />} /><Select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Tüm kategoriler</option>{categories.map((item) => <option key={item}>{item}</option>)}</Select><Input type="date" icon={<CalendarDays size={18} />} /><Select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Yeniye göre</option><option value="popular">Popüler</option><option value="price">Fiyat düşük</option></Select></div></motion.div></section>
      <div className="my-8 flex items-center justify-between gap-4"><div className="flex items-center gap-2 text-sm text-white/55"><SlidersHorizontal size={16} /> {events.length} oyun backendden gösteriliyor</div><div className="hidden w-64 md:block"><GoldDivider /></div></div>
      {events.length ? <div className="grid gap-6 md:grid-cols-3">{events.map((event) => <EventCard event={event} key={event.id} />)}</div> : <EmptyState title="Etkinlik bulunamadı" text="Backendde etkinlik yok veya filtreye uygun sonuç dönmedi." />}
    </main>
  );
}
