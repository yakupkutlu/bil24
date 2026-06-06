import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Filter, Search, TimerReset } from 'lucide-react';
import { StaffReservationCard } from '@/components/box-office/StaffReservationCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import type { BookingStatus } from '@/types';
import { bookingsService } from '@/services/bookings.service';
import { boxOfficeService } from '@/services/boxOffice.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useToast } from '@/components/ui/ToastProvider';

export function BoxOfficeReservationsPage() {
  const { showToast } = useToast();
  const qc = useQueryClient();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | BookingStatus>('ALL');

  const reservationsQuery = useApiResource(['box-office-reservations', status], () =>
    bookingsService.list({
      status: status === 'ALL' ? undefined : status
    })
  );

  const reservations = useMemo(
    () =>
      (reservationsQuery.data?.data ?? []).filter((booking) => {
        const search = query.toLowerCase();

        const matchesQuery =
          booking.bookingNumber.toLowerCase().includes(search) ||
          booking.seats.some((seat) => seat.seatCode.toLowerCase().includes(search));

        return matchesQuery;
      }),
    [query, reservationsQuery.data]
  );

  const cancelMutation = useMutation({
    mutationFn: (id: string) => boxOfficeService.cancelReservation(id),
    onSuccess: () => {
      showToast('Reservation cancelled successfully.');
      qc.invalidateQueries({ queryKey: ['box-office-reservations'] });
    },
    onError: (e) => {
      showToast(e instanceof Error ? e.message : 'Cancellation failed.', 'error');
    }
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => boxOfficeService.confirmReservationPayment(id, 'CASH'),
    onSuccess: () => {
      showToast('Reservation payment confirmed.');
      qc.invalidateQueries({ queryKey: ['box-office-reservations'] });
    },
    onError: (e) => {
      showToast(e instanceof Error ? e.message : 'Payment failed.', 'error');
    }
  });

  if (reservationsQuery.isLoading) {
    return <LoadingState text="Loading reservations..." />;
  }

  if (reservationsQuery.isError) {
    return (
      <ErrorState
        title="Reservations could not be loaded"
        text={(reservationsQuery.error as Error).message}
      />
    );
  }

  return (
    <main className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <p className="text-sm uppercase tracking-[.28em] text-theater-gold">
          Reservations desk
        </p>

        <h1 className="font-serif text-5xl text-white">
          Turn holds into paid theater nights.
        </h1>
      </motion.header>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Active reservations"
          value={reservations.length}
          icon={<TimerReset />}
          hint="Current reservations"
        />

        <DashboardCard
          title="Pending"
          value={reservations.filter((b) => b.status === 'PENDING').length}
          icon={<TimerReset />}
          hint="Waiting for action"
        />

        <DashboardCard
          title="Reserved"
          value={reservations.filter((b) => b.status === 'RESERVED').length}
          icon={<TimerReset />}
          hint="Held seats"
        />
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_220px_auto] md:items-end">
          <Input
            label="Search"
            placeholder="Reservation number, customer, seat..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon={<Search size={16} />}
          />

          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'ALL' | BookingStatus)}
          >
            {['ALL', 'RESERVED', 'PENDING', 'PAID', 'CANCELLED', 'EXPIRED'].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>

          <Button variant="outline">
            <Filter size={16} />
            More filters
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-4">
        {reservations.length ? (
          reservations.map((booking) => (
            <StaffReservationCard
              key={booking.id}
              booking={booking}
              onConfirm={() => payMutation.mutate(booking.id)}
              onExtend={() => showToast('Extend reservation endpoint is not available yet.', 'info')}
              onCancel={() => cancelMutation.mutate(booking.id)}
            />
          ))
        ) : (
          <EmptyState
            title="No reservations found"
            text="No reservations match the selected filters."
          />
        )}
      </section>
    </main>
  );
}