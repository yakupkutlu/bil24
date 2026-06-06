import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { OrderExperienceCard } from '@/components/customer/OrderExperienceCard';
import { bookingsService } from '@/services/bookings.service';
import { useApiResource } from '@/hooks/useApiResource';

export function CustomerOrdersPage() {
  const [query, setQuery] = useState('');

  const ordersQuery = useApiResource(['customer-orders'], () => bookingsService.my());

  const orders = ordersQuery.data?.data ?? [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return orders;

    return orders.filter((booking) => {
      const bookingNumber = booking.bookingNumber?.toLowerCase() ?? '';
      const status = booking.status?.toLowerCase() ?? '';
      const customerName = booking.customer?.fullName?.toLowerCase() ?? '';

      return (
        bookingNumber.includes(q) ||
        status.includes(q) ||
        customerName.includes(q)
      );
    });
  }, [orders, query]);

  if (ordersQuery.isLoading) {
    return <LoadingState text="Backend siparişleri yükleniyor..." />;
  }

  if (ordersQuery.isError) {
    return (
      <ErrorState
        title="Siparişler yüklenemedi"
        text={(ordersQuery.error as Error).message}
      />
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[.045] p-7">
        <h1 className="font-serif text-5xl text-white">Sipariş arşivi</h1>

        <p className="mt-3 text-white/60">
          Tüm siparişler backend üzerinden <code>/api/bookings/my</code> endpointinden yüklenir.
        </p>

        <div className="mt-5 max-w-lg">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sipariş ara..."
            icon={<Search size={18} />}
          />
        </div>
      </section>

      {visible.length ? (
        visible.map((booking, index) => (
          <OrderExperienceCard
            key={booking.id}
            booking={booking}
            index={index}
          />
        ))
      ) : (
        <EmptyState
          title="Sipariş yok"
          text="Backend henüz rezervasyon döndürmedi."
        />
      )}
    </main>
  );
}