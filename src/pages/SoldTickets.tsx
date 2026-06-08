import { useEffect, useState, useMemo } from 'react';
import { ticketsApi } from '../lib/api';
import { formatDate, formatTime, formatCurrency } from '../lib/utils';
import type { Ticket, Session, Event, Seat, Hall } from '../types';
import {
  Search, Ticket as TicketIcon, User, Phone, Mail,
  Calendar, MapPin, Tag, X, Clock,
} from 'lucide-react';

type TicketWithDetails = Omit<Ticket, 'seat'> & {
  session?: Omit<Session, 'event' | 'hall'> & { event?: Event; hall?: Hall };
  seat?: Seat;
};

const STATUS_LABEL: Record<string, string> = {
  active:    'Aktif',
  used:      'Kullanıldı',
  cancelled: 'İptal',
  expired:   'Süresi Doldu',
};

const STATUS_COLOR: Record<string, string> = {
  active:    'bg-green-100 text-green-700 border-green-200',
  used:      'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  expired:   'bg-gray-100 text-gray-600 border-gray-200',
};

const DEFAULT_COUNT = 5;

export default function SoldTickets() {
  const [tickets,  setTickets]  = useState<TicketWithDetails[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [query,    setQuery]    = useState('');

  useEffect(() => {
    ticketsApi.list()
      .then(data => setTickets((data as unknown as TicketWithDetails[]) || []))
      .catch(() => setError('Biletler yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  // Tarihe göre azalan sırada — en yeni üstte
  const sorted = useMemo(
    () => [...tickets].sort((a, b) =>
      new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    ),
    [tickets]
  );

  // Arama filtresi: ad/soyad, telefon, e-posta
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted.slice(0, DEFAULT_COUNT);
    return sorted.filter(t =>
      t.customer_name?.toLowerCase().includes(q) ||
      (t as any).customer_phone?.toLowerCase().includes(q) ||
      (t as any).customer_email?.toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const isSearching = query.trim().length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Başlık + Arama */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Satılan Biletler</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isSearching
              ? `"${query}" için ${filtered.length} sonuç bulundu`
              : `Son ${Math.min(DEFAULT_COUNT, sorted.length)} satış gösteriliyor — toplam ${sorted.length} bilet`}
          </p>
        </div>

        {/* Arama kutusu */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ad, telefon veya e-posta..."
            className="w-full pl-9 pr-9 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Boş durum */}
      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <TicketIcon className="w-14 h-14 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          {sorted.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Henüz hiç bilet satılmamış.</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Bu arama kriterine uyan bilet bulunamadı.
            </p>
          )}
        </div>
      )}

      {/* Bilet kartları */}
      <div className="space-y-3">
        {filtered.map(ticket => {
          const t = ticket as any;
          return (
            <div key={ticket.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

              {/* Üst şerit: etkinlik + durum */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar size={14} className="text-blue-500 flex-shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {ticket.session?.event?.title || '—'}
                  </span>
                  {ticket.session && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDate(ticket.session.session_date as string)}
                      {' '}
                      <Clock size={11} className="inline mb-0.5" />
                      {' '}
                      {formatTime(ticket.session.start_time as string)}
                    </span>
                  )}
                </div>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLOR[ticket.status] ?? STATUS_COLOR.expired}`}>
                  {STATUS_LABEL[ticket.status] ?? ticket.status}
                </span>
              </div>

              {/* İçerik: 2 kolon */}
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {/* Sol: Kişi bilgileri */}
                <div className="space-y-2">
                  <InfoRow icon={<User size={14} className="text-blue-400" />} label="Ad Soyad" value={ticket.customer_name || '—'} />
                  <InfoRow icon={<Phone size={14} className="text-green-400" />} label="Telefon" value={t.customer_phone || '—'} mono />
                  <InfoRow icon={<Mail size={14} className="text-purple-400" />} label="E-posta" value={t.customer_email || '—'} mono />
                </div>

                {/* Sağ: Bilet / salon bilgileri */}
                <div className="space-y-2">
                  {ticket.session?.hall?.name && (
                    <InfoRow icon={<MapPin size={14} className="text-orange-400" />} label="Salon" value={ticket.session.hall.name} />
                  )}
                  {ticket.seat?.seat_label && (
                    <InfoRow icon={<TicketIcon size={14} className="text-indigo-400" />} label="Koltuk" value={ticket.seat.seat_label} />
                  )}
                  {ticket.total_amount != null && (
                    <InfoRow icon={<Tag size={14} className="text-yellow-500" />} label="Tutar" value={formatCurrency(Number(ticket.total_amount))} bold />
                  )}
                </div>
              </div>

              {/* Alt şerit: bilet kodu + tarih */}
              <div className="px-5 py-2.5 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
                <span className="font-mono font-semibold tracking-wide text-gray-600 dark:text-gray-300">
                  {ticket.ticket_code}
                </span>
                {ticket.created_at && (
                  <span>
                    {new Date(ticket.created_at).toLocaleString('tr-TR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daha fazla uyarısı (arama yokken) */}
      {!isSearching && sorted.length > DEFAULT_COUNT && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 pt-2">
          Tüm biletleri görmek için yukarıdaki arama kutusunu kullanın.
        </p>
      )}
    </div>
  );
}

// ── Yardımcı satır bileşeni ───────────────────────────────────────────────────
function InfoRow({
  icon, label, value, mono = false, bold = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-400 w-16 flex-shrink-0">{label}</span>
      <span className={`text-sm truncate ${bold ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
