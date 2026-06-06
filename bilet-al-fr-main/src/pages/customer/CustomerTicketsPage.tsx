import { useMemo, useState } from 'react';
import { Search, Ticket } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { TicketCard } from '@/components/tickets/TicketCard';
import { ticketsService } from '@/services/tickets.service';
import { useApiResource } from '@/hooks/useApiResource';
import type { TicketStatus, Ticket as TicketType } from '@/types';

const tabs: { label: string; value: TicketStatus | 'ALL' }[] = [
  { label: 'Tümü', value: 'ALL' }, { label: 'Yaklaşan', value: 'VALID' }, { label: 'Kullanıldı', value: 'USED' }, { label: 'İptal edildi', value: 'CANCELLED' }, { label: 'İade edildi', value: 'REFUNDED' }, { label: 'Süresi doldu', value: 'EXPIRED' }
];

export function CustomerTicketsPage() {
  const [active, setActive] = useState<TicketStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const ticketsQuery = useApiResource(['customer-tickets'], () => ticketsService.my());
  const tickets = ticketsQuery.data?.data ?? [];
  const visible = useMemo(() => filterTickets(tickets, active, query), [tickets, active, query]);

  if (ticketsQuery.isLoading) return <LoadingState text="Biletler backendden yükleniyor..." />;
  if (ticketsQuery.isError) return <ErrorState title="Biletler yüklenemedi" text={(ticketsQuery.error as Error).message} />;

  return <main className="mx-auto max-w-7xl px-4 py-8"><section className="mb-7 rounded-[2rem] border border-theater-gold/20 bg-gradient-to-br from-theater-red/25 to-white/[.045] p-7"><p className="flex items-center gap-2 text-sm uppercase tracking-[.28em] text-theater-gold"><Ticket size={16} /> Bilet cüzdanı</p><h1 className="mt-3 font-serif text-5xl text-white">Canlı QR biletlerim</h1><p className="mt-3 max-w-2xl text-white/60">Tüm kartlar /api/tickets/my üzerinden gelir. Biletler yalnızca backendden yüklenir.</p><div className="mt-6 max-w-lg"><Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Bilet, etkinlik veya koltuk ara..." icon={<Search size={18}/>} /></div></section><div className="flex flex-wrap gap-2">{tabs.map((tab)=><Button key={tab.value} size="sm" variant={active === tab.value ? 'gold' : 'secondary'} onClick={() => setActive(tab.value)}>{tab.label}</Button>)}</div><div className="mt-6 grid gap-5">{visible.length ? visible.map((ticket)=><TicketCard key={ticket.id} ticket={ticket}/>) : <EmptyState title="Bilet yok" text="Backend bu filtre için bilet döndürmedi." />}</div></main>;
}

function filterTickets(tickets: TicketType[], status: TicketStatus | 'ALL', query: string) {
  return tickets.filter((ticket) => {
    const eventTitle = typeof ticket.event === 'string' ? ticket.event : ticket.event.title;
    const matchesStatus = status === 'ALL' || ticket.status === status;
    const term = query.toLowerCase();
    const matchesQuery = !term || [ticket.ticketNumber, ticket.seatCode, eventTitle].join(' ').toLowerCase().includes(term);
    return matchesStatus && matchesQuery;
  });
}
