import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Film, Languages, PlayCircle, Star, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ShowtimeCard } from '@/components/events/ShowtimeCard';
import { NotFoundPage } from '@/components/layout/NotFoundPage';
import { GoldDivider } from '@/components/brand/GoldDivider';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { eventsService } from '@/services/events.service';
import { showtimesService } from '@/services/showtimes.service';
import { useApiResource } from '@/hooks/useApiResource';
import { ApiModeBadge } from '@/components/integration/ApiModeBadge';

export function EventDetailsPage() {
  const { eventSlug } = useParams();
  const eventQuery = useApiResource(['event', eventSlug], () => eventsService.getBySlug(eventSlug ?? ''), undefined, { enabled: Boolean(eventSlug) });
  const event = eventQuery.data?.data;
  const showtimeQuery = useApiResource(['event-showtimes', event?.id], () => showtimesService.listByEvent(event!.id), [], { enabled: Boolean(event?.id) });

  if (eventQuery.isLoading) return <LoadingState text="Etkinlik detayları backendden yükleniyor..." />;
  if (eventQuery.isError) return <ErrorState title="Etkinlik yüklenemedi" text={(eventQuery.error as Error).message} />;
  if (!event) return <NotFoundPage />;
  const showtimes = showtimeQuery.data?.data ?? [];

  return (
    <main>
      <section className="relative min-h-[650px] overflow-hidden"><img src={event.posterImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 blur-[1px]" /><div className="absolute inset-0 bg-gradient-to-t from-theater-black via-theater-black/85 to-theater-burgundy/55" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(184,134,11,.28),transparent_34%)]" /><div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[380px_1fr]"><motion.div initial={{ opacity: 0, rotate: -4, y: 30 }} animate={{ opacity: 1, rotate: -1.5, y: 0 }} transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }} className="relative"><div className="absolute -inset-5 rounded-[2.5rem] bg-theater-gold/15 blur-2xl" /><img src={event.posterImage} alt={event.title} className="relative h-[540px] w-full rounded-[2rem] border border-theater-gold/25 object-cover shadow-strongGlow" /></motion.div><motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16, duration: .65 }} className="flex flex-col justify-center"><div className="flex flex-wrap items-center gap-3"><Badge>{event.category}</Badge><span className="rounded-full border border-theater-gold/25 bg-theater-gold/10 px-3 py-1 text-xs uppercase tracking-[.24em] text-theater-gold">Canlı performans</span><ApiModeBadge source={eventQuery.data?.source} /></div><h1 className="mt-6 font-serif text-6xl text-white md:text-7xl">{event.title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">{event.description}</p><div className="mt-8 grid gap-4 md:grid-cols-4"><Info icon={<Clock />} label={`${event.durationMinutes} dk`} /><Info icon={<Languages />} label={event.language} /><Info icon={<UserRound />} label={event.director} /><Info icon={<Film />} label={event.ageLimit} /></div><div className="mt-9 flex flex-wrap gap-3">{showtimes[0] ? <Button asChild size="lg"><Link to={`/showtimes/${showtimes[0].id}/seats`}>Bilet al</Link></Button> : <Button disabled size="lg">Seans yok</Button>}<Button variant="outline" size="lg"><PlayCircle size={18} /> Fragman</Button></div></motion.div></div></section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[1fr_.85fr]"><Card className="overflow-hidden"><CardContent className="p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-sm uppercase tracking-[.35em] text-theater-gold">Oyuncular</p><h2 className="mt-2 font-serif text-3xl text-white">Oyuncular ve ekip</h2></div><Star className="text-theater-gold" /></div><div className="my-6"><GoldDivider /></div><div className="grid gap-4 sm:grid-cols-2">{event.cast.length ? event.cast.map((cast) => <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4 transition hover:border-theater-gold/40 hover:bg-white/[.07]" key={cast.name}><p className="font-semibold text-white">{cast.name}</p><p className="mt-1 text-sm text-theater-gold">{cast.role}</p></div>) : <p className="rounded-2xl border border-dashed border-white/15 p-4 text-white/45">Backend henüz oyuncu kadrosu döndürmedi.</p>}</div></CardContent></Card><div className="space-y-4"><div><p className="text-sm uppercase tracking-[.35em] text-theater-gold">Seanslar</p><h2 className="mt-2 font-serif text-3xl text-white">Uygun seanslar</h2></div>{showtimeQuery.isLoading ? <LoadingState text="Seanslar yükleniyor..." /> : showtimeQuery.isError ? <ErrorState title="Seanslar yüklenemedi" text={(showtimeQuery.error as Error).message} /> : showtimes.length ? showtimes.map((show) => <ShowtimeCard key={show.id} showtime={show} />) : <EmptyState title="Seans yok" text="Backend bu etkinlik için seans döndürmedi." />}</div></section>
    </main>
  );
}

function Info({ icon, label }: { icon: ReactNode; label: string }) {
  return <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-4 text-white/80 backdrop-blur">{icon}<span>{label}</span></div>;
}
