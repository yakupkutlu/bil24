import { useEffect, useMemo, useState } from 'react';
import { Ticket, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ticketsApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Ticket as TicketType, Session, Event, Seat, Hall } from '../types';
import { formatDate, formatTime } from '../lib/utils';
import TicketCard from '../components/tickets/TicketCard';

type TicketWithDetails = Omit<TicketType, 'seat'> & {
  session?: Omit<Session, 'event' | 'hall'> & { event?: Event; hall?: Hall };
  seat?: Seat;
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  used: 'Kullanıldı',
  cancelled: 'İptal',
  expired: 'Süresi Doldu',
};

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  used: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
};

const PAGE_SIZE = 10;

export default function MyTickets() {
  const { user, isAdmin, isOperator } = useAuth();
  const isStaff = isAdmin || isOperator;

  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Müşteri → sadece kendi biletleri; personel/admin → tümü
    const params = isStaff ? {} : { sold_by: user.id };
    ticketsApi.list(params as any)
      .then(data => setTickets((data as unknown as TicketWithDetails[]) || []))
      .catch(err => console.error('Biletler yüklenemedi:', err))
      .finally(() => setLoading(false));
  }, [user, isStaff]);

  // Arama filtresi — etkinlik adı, müşteri adı, bilet kodu
  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(t =>
      t.session?.event?.title?.toLowerCase().includes(q) ||
      t.customer_name?.toLowerCase().includes(q) ||
      t.ticket_code?.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  // Sayfalama
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Arama değişince sayfa sıfırla
  useEffect(() => { setPage(1); }, [search]);

  const pageTitle = isStaff ? 'Tüm Biletler' : 'Biletlerim';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık + Arama */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">{pageTitle}</h1>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Etkinlik, müşteri veya bilet kodu..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Toplam sayı */}
      {tickets.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filtered.length} bilet{filtered.length !== tickets.length ? ` (${tickets.length} içinden filtrelendi)` : ''}
        </p>
      )}

      {/* Boş durum */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Ticket className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          {tickets.length === 0 ? (
            <>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {isStaff ? 'Henüz hiç bilet yok' : 'Henüz biletiniz yok'}
              </h3>
              <p className="text-gray-500">
                {isStaff ? 'Satış gerçekleştikten sonra burada görünecek.' : 'Etkinlik sayfasından bilet satın alabilirsiniz.'}
              </p>
            </>
          ) : (
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Arama sonucu bulunamadı</h3>
          )}
        </div>
      )}

      {/* Bilet listesi */}
      {paged.length > 0 && (
        <div className="space-y-3">
          {paged.map(ticket => {
            const isExpanded = expandedId === ticket.id;
            return (
              <div
                key={ticket.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
              >
                {/* Özet satır */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  <span className={`shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[ticket.status] ?? STATUS_COLOR.expired}`}>
                    {STATUS_LABEL[ticket.status] ?? ticket.status}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {ticket.session?.event?.title || 'Etkinlik'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {ticket.session?.session_date ? formatDate(ticket.session.session_date as string) : '—'}
                      {' · '}
                      {ticket.session?.start_time ? formatTime(ticket.session.start_time as string) : '—'}
                      {ticket.session?.hall?.name ? ` · ${ticket.session.hall.name}` : ''}
                    </p>
                    {/* Admin/operatör için müşteri adını da göster */}
                    {isStaff && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        👤 {ticket.customer_name} · <span className="font-mono">{ticket.ticket_code}</span>
                      </p>
                    )}
                  </div>

                  {ticket.seat?.seat_label && (
                    <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                      🎫 {ticket.seat.seat_label}
                    </span>
                  )}

                  <span className="shrink-0 text-gray-400 text-xs ml-2">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* Dijital bilet */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-6">
                    <TicketCard
                      ticket={ticket}
                      session={ticket.session as any}
                      seat={ticket.seat}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={15} /> Önceki
            </button>

            {/* Sayfa numaraları */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                        page === p
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Sonraki <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
