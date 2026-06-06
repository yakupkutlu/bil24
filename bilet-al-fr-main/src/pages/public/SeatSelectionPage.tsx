import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles, TicketCheck } from 'lucide-react';
import { SeatMapViewer } from '@/components/seats/SeatMapViewer';
import { BookingCountdown } from '@/components/checkout/BookingCountdown';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useBookingStore } from '@/stores/booking.store';
import { formatDateTime, money } from '@/utils/formatters';
import { showtimesService } from '@/services/showtimes.service';
import { seatsService } from '@/services/seats.service';
import { useApiResource } from '@/hooks/useApiResource';
import { ApiModeBadge } from '@/components/integration/ApiModeBadge';
import { normalizeSeat } from '@/utils/apiAdapters';
import { useToast } from '@/components/ui/ToastProvider';

const holdMinutes = 10;
const sessionId = `web-${Math.random().toString(36).slice(2)}`;

export function SeatSelectionPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const beginHold = useBookingStore((state) => state.beginHold);
  const seatHoldExpiresAt = useBookingStore((state) => state.seatHoldExpiresAt);
  const priceSummary = useBookingStore((state) => state.priceSummary);

  const initialSelectedSeats = useMemo(
    () => useBookingStore.getState().selectedSeats.map((seat) => seat.code),
    []
  );

  const [selected, setSelected] = useState<string[]>(initialSelectedSeats);

  const lastHoldKeyRef = useRef('');

  const showtimeQuery = useApiResource(
    ['showtime', showtimeId],
    () => showtimesService.get(showtimeId ?? ''),
    undefined,
    { enabled: Boolean(showtimeId) }
  );

  const showtime = showtimeQuery.data?.data;
  const event = showtime && typeof showtime.event !== 'string' ? showtime.event : undefined;

  const seatsQuery = useApiResource(
    ['showtime-seats', showtime?.id],
    async () => {
      if (!showtime?.id) return [];

      const response = await seatsService.availability(showtime.id);
      return (response.seats ?? []).map(normalizeSeat);
    },
    [],
    {
      enabled: Boolean(showtime?.id),
      refetchInterval: 20_000
    }
  );

  const seats = seatsQuery.data?.data ?? [];

  const selectedSeats = useMemo(
    () => seats.filter((seat) => selected.includes(seat.code)),
    [seats, selected]
  );

  const selectedSeatCodesKey = useMemo(
    () => selectedSeats.map((seat) => seat.code).join(','),
    [selectedSeats]
  );

  const holdMutation = useMutation({
    mutationFn: (seatCodes: string[]) => seatsService.hold(showtime!.id, seatCodes, sessionId),
    onSuccess: () => {
      showToast('Koltuklar backend koltuk kilitleme endpointiyle kilitlendi.');
      navigate('/checkout');
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Backend koltuk kilitleme başarısız oldu.', 'error');
    }
  });

  useEffect(() => {
    if (!showtime || selectedSeats.length === 0) {
      lastHoldKeyRef.current = '';
      return;
    }

    const holdKey = `${showtime.id}:${selectedSeatCodesKey}`;

    if (lastHoldKeyRef.current === holdKey) return;

    lastHoldKeyRef.current = holdKey;

    beginHold({
      event,
      showtime,
      seats: selectedSeats,
      holdMinutes
    });
  }, [beginHold, event, selectedSeats, selectedSeatCodesKey, showtime]);

  const toggleSeat = (seatCode: string) => {
    setSelected((current) =>
      current.includes(seatCode)
        ? current.filter((item) => item !== seatCode)
        : [...current, seatCode]
    );
  };

  const continueToCheckout = () => {
    if (!selectedSeats.length || holdMutation.isPending) return;

    holdMutation.mutate(selectedSeats.map((seat) => seat.code));
  };

  if (!showtimeId) return <Navigate to="/events" replace />;

  if (showtimeQuery.isLoading || seatsQuery.isLoading) {
    return <LoadingState text="Canlı koltuk müsaitliği yükleniyor..." />;
  }

  if (showtimeQuery.isError) {
    return (
      <ErrorState
        title="Seans yüklenemedi"
        text={(showtimeQuery.error as Error).message}
      />
    );
  }

  if (seatsQuery.isError) {
    return (
      <ErrorState
        title="Koltuklar yüklenemedi"
        text={(seatsQuery.error as Error).message}
      />
    );
  }

  if (!showtime) {
    return <EmptyState title="Seans bulunamadı" text="Backend bu seansı döndürmedi." />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 pb-28 lg:pb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-xl backdrop-blur md:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-2 text-sm uppercase tracking-[.32em] text-theater-gold">
                <Sparkles size={16} /> Koltuk seçimi
              </p>
            </div>

            <h1 className="mt-3 font-serif text-4xl text-white md:text-6xl">
              {event?.title ?? 'Seans'}
            </h1>

            <p className="mt-3 max-w-2xl text-white/60">
              {formatDateTime(showtime.date)} · {showtime.startTime}
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/60">
              <span className="rounded-full border border-theater-gold/25 bg-theater-gold/10 px-4 py-2 text-theater-ivory">
                Canlı seats
              </span>
              <span className="rounded-full border border-white/10 bg-white/[.045] px-4 py-2">
                20 sn refresh
              </span>
              <span className="rounded-full border border-white/10 bg-white/[.045] px-4 py-2">
                Backend koltuk kilitleme
              </span>
            </div>
          </div>

          <BookingCountdown expiresAt={seatHoldExpiresAt} />
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
        {seats.length ? (
          <SeatMapViewer
            seats={seats}
            selected={selected}
            onSelect={(seat) => toggleSeat(seat.code)}
          />
        ) : (
          <EmptyState
            title="Backendden koltuk gelmedi"
            text="Bu salon/seans için koltukları oluştur veya GET /api/showtimes/:id/seats endpointini kontrol et."
          />
        )}

        <Card className="h-fit lg:sticky lg:top-28">
          <CardContent className="space-y-5 p-6">
            <div className="rounded-2xl border border-theater-gold/30 bg-theater-gold/10 p-4 text-center text-theater-ivory">
              <LockKeyhole className="mx-auto mb-2 text-theater-gold" />
              Seçtiğin koltuklar backend ile kilitlenir.
            </div>

            <div>
              <h2 className="font-serif text-2xl text-white">Seçilen koltuklar</h2>
              <p className="mt-1 text-sm text-white/60">
                Müsait koltuklara tıklayarak seçimini değiştirebilirsin.
              </p>
            </div>

            <div className="max-h-72 space-y-2 overflow-auto pr-1 theater-scrollbar">
              {selectedSeats.length ? (
                selectedSeats.map((seat, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm"
                    key={seat.code}
                  >
                    <span className="text-white">
                      {seat.code} · {seat.category}
                    </span>
                    <span className="text-theater-gold">{money(seat.price)}</span>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/45">
                  Henüz koltuk seçilmedi.
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-white/10 pt-4 text-sm text-white/60">
              <div className="flex justify-between">
                <span>Ara toplam</span>
                <span>{money(priceSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Servis ücreti</span>
                <span>{money(priceSummary.serviceFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vergi</span>
                <span>{money(priceSummary.tax)}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg">
              <span className="text-white">Toplam</span>
              <strong className="text-theater-gold">{money(priceSummary.total)}</strong>
            </div>

            {selectedSeats.length ? (
              <Button
                className="w-full"
                onClick={continueToCheckout}
                disabled={holdMutation.isPending}
              >
                {holdMutation.isPending ? (
                  'Koltuklar kilitleniyor...'
                ) : (
                  <>
                    Ödeme’a devam et <ArrowRight size={16} />
                  </>
                )}
              </Button>
            ) : (
              <Button className="w-full" disabled>
                Önce koltuk seç
              </Button>
            )}

            <div className="grid gap-2 text-xs text-white/50">
              <span className="flex items-center gap-2">
                <TicketCheck size={14} className="text-theater-gold" />
                Ödeme sonrası QR e-bilet oluşturulur.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}