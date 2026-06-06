import { useMemo, useState } from 'react';
import { Armchair, Accessibility, Gem, GraduationCap, Info, Sparkles } from 'lucide-react';
import type { Seat } from '@/types';
import { cn } from '@/utils/cn';
import { money } from '@/utils/formatters';

const statusClasses: Record<Seat['status'], string> = {
  AVAILABLE: 'bg-white/10 hover:bg-theater-gold/75 hover:text-theater-black text-white border-white/15 hover:border-theater-gold/90',
  SELECTED: 'bg-theater-gold text-theater-black border-theater-gold shadow-glow seat-selected-ring',
  HELD: 'bg-yellow-500/25 text-yellow-100 border-yellow-400/40 cursor-not-allowed seat-pulse',
  SOLD: 'bg-red-500/30 text-red-100 border-red-300/30 cursor-not-allowed opacity-80',
  DISABLED: 'bg-white/5 text-white/25 border-white/5 cursor-not-allowed'
};

const categoryIcon: Record<Seat['category'], JSX.Element> = {
  VIP: <Gem size={12} />,
  STANDARD: <Armchair size={13} />,
  STUDENT: <GraduationCap size={13} />
};

const statusLabel: Record<Seat['status'], string> = {
  AVAILABLE: 'Müsait',
  SELECTED: 'Seçildi',
  HELD: 'Tutuluyor',
  SOLD: 'Satıldı',
  DISABLED: 'Kapalı'
};

export function SeatMapViewer({ seats, selected = [], onToggle, onSelect }: {
  seats: Seat[];
  selected?: string[];
  onToggle?: (seat: Seat) => void;
  onSelect?: (seat: Seat) => void;
}) {
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const grouped = useMemo(() => seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    const row = seat.row || seat.code[0];
    acc[row] = [...(acc[row] || []), { ...seat, status: selected.includes(seat.code) ? 'SELECTED' : seat.status }];
    return acc;
  }, {}), [seats, selected]);

  const counts = useMemo(() => seats.reduce<Record<string, number>>((acc, seat) => {
    const status = selected.includes(seat.code) ? 'SELECTED' : seat.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}), [seats, selected]);

  const handleSelect = (seat: Seat) => {
    if (['SOLD', 'HELD', 'DISABLED'].includes(seat.status)) return;
    onToggle?.(seat);
    onSelect?.(seat);
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/35 shadow-xl backdrop-blur theater-scrollbar">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(184,134,11,.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(122,12,12,.22),transparent_38%)]" />
      <div className="relative border-b border-white/10 bg-white/[.035] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[.28em] text-theater-gold"><Sparkles size={14} /> Interactive seat map</p>
            <h2 className="mt-2 font-serif text-3xl text-white">Sahneye en yakın anını seç</h2>
            <p className="mt-1 text-sm text-white/55">Mobilde yatay kaydırabilir, koltukların üzerine gelerek detay görebilirsin.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs md:min-w-72">
            <div className="rounded-2xl border border-theater-gold/25 bg-theater-gold/10 p-3"><strong className="block text-lg text-theater-gold">{counts.AVAILABLE || 0}</strong><span className="text-white/50">Müsait</span></div>
            <div className="rounded-2xl border border-theater-gold/25 bg-theater-gold/10 p-3"><strong className="block text-lg text-theater-gold">{counts.SELECTED || 0}</strong><span className="text-white/50">Seçildi</span></div>
            <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3"><strong className="block text-lg text-red-100">{(counts.SOLD || 0) + (counts.HELD || 0)}</strong><span className="text-white/50">Dolu</span></div>
          </div>
        </div>
      </div>

      <div className="relative overflow-auto p-5 md:p-7 theater-scrollbar">
        <div className="pointer-events-none absolute inset-x-10 top-10 h-36 rounded-full bg-theater-gold/12 blur-3xl" />
        <div className="relative mx-auto mb-10 max-w-3xl text-center">
          <div className="mx-auto h-12 w-4/5 screen-arc bg-gradient-to-b from-theater-gold/90 via-theater-gold/25 to-transparent text-center text-xs font-semibold uppercase tracking-[.42em] text-theater-ivory shadow-glow">
            <span className="relative top-3">SAHNE</span>
          </div>
          <div className="mx-auto mt-2 h-10 w-3/5 rounded-b-full bg-gradient-to-b from-theater-gold/15 to-transparent blur-sm" />
          <p className="-mt-3 text-xs text-white/45">Işıklar sahnede. Koltuğunu seç ve hikâyeye yaklaş.</p>
        </div>

        <div className="relative mx-auto min-w-[700px] space-y-3 pb-4">
          {Object.entries(grouped).map(([row, rowSeats]) => (
            <div key={row} className="flex items-center justify-center gap-2">
              <span className="mr-2 w-7 rounded-full bg-theater-gold/10 py-1 text-center text-xs text-theater-gold">{row}</span>
              {rowSeats.map((seat, index) => (
                <button
                  key={seat.code}
                  title={`${seat.code} · ${seat.category} · ${statusLabel[seat.status]}`}
                  disabled={['SOLD', 'HELD', 'DISABLED'].includes(seat.status)}
                  onClick={() => handleSelect(seat)}
                  onMouseEnter={() => setHoveredSeat(seat)}
                  onMouseLeave={() => setHoveredSeat(null)}
                  className={cn('group/seat relative grid h-11 w-11 place-items-center rounded-xl border text-xs font-semibold transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-theater-gold/60', index === 5 && 'ml-7', statusClasses[seat.status])}
                >
                  <span className="relative z-10">{seat.isAccessible ? <Accessibility size={15} /> : categoryIcon[seat.category]}</span>
                  <span className="pointer-events-none absolute -top-16 left-1/2 hidden min-w-40 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/90 p-3 text-left text-[11px] text-white shadow-xl backdrop-blur group-hover/seat:block">
                    <strong className="block text-theater-gold">{seat.code} · {seat.category}</strong>
                    <span className="mt-1 block text-white/60">{statusLabel[seat.status]} · {money(seat.price)}</span>
                  </span>
                </button>
              ))}
              <span className="ml-2 w-7 rounded-full bg-theater-gold/10 py-1 text-center text-xs text-theater-gold">{row}</span>
            </div>
          ))}
        </div>

        {hoveredSeat && (
          <div className="mx-auto mt-2 flex max-w-xl items-center justify-between rounded-2xl border border-white/10 bg-white/[.045] p-4 text-sm text-white/65">
            <span className="flex items-center gap-2"><Info size={15} className="text-theater-gold" /> {hoveredSeat.code} koltuğu</span>
            <span>{hoveredSeat.category} · {statusLabel[selected.includes(hoveredSeat.code) ? 'SELECTED' : hoveredSeat.status]} · <b className="text-theater-gold">{money(hoveredSeat.price)}</b></span>
          </div>
        )}
      </div>

      <div className="relative border-t border-white/10 bg-black/20 p-5">
        <div className="flex flex-wrap justify-center gap-3 text-xs text-white/60">
          {(['AVAILABLE', 'SELECTED', 'HELD', 'SOLD', 'DISABLED'] as const).map((status) => (
            <span key={status} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-2"><span className={cn('h-4 w-4 rounded border', statusClasses[status])} />{statusLabel[status]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
