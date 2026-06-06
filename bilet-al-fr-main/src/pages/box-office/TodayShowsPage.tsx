import { motion } from 'framer-motion';
import { LiveShowRunCard } from '@/components/box-office/LiveShowRunCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { showtimesService } from '@/services/showtimes.service';
import { useApiResource } from '@/hooks/useApiResource';

export function TodayShowsPage() {
  const showtimesQuery = useApiResource(['box-office-today-shows'], () =>
    showtimesService.list({ today: true })
  );

  if (showtimesQuery.isLoading) {
    return <LoadingState text="Bugünkü seanslar backendden yükleniyor..." />;
  }

  if (showtimesQuery.isError) {
    return (
      <ErrorState
        title="Bugünkü seanslar yüklenemedi"
        text={(showtimesQuery.error as Error).message}
      />
    );
  }

  const showtimes = showtimesQuery.data?.data ?? [];

  return (
    <main className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <p className="text-sm uppercase tracking-[.28em] text-theater-gold">
          Bugünkü seanslar
        </p>

        <h1 className="font-serif text-5xl text-white">
          Every show, every door, ready on time.
        </h1>
      </motion.header>

      <section className="space-y-4">
        {showtimes.length ? (
          showtimes.map((show) => (
            <LiveShowRunCard
              key={show.id}
              showtime={show}
              sold={0}
              capacity={typeof show.hall === 'string' ? 0 : show.hall.capacity}
            />
          ))
        ) : (
          <EmptyState
            title="Bugün seans yok"
            text="Backend bugün için seans döndürmedi."
          />
        )}
      </section>
    </main>
  );
}
