import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, Search, TicketCheck, UserPlus } from 'lucide-react';
import { ManualSaleStepper } from '@/components/box-office/ManualSaleStepper';
import { PaymentReceiptPreview } from '@/components/box-office/PaymentReceiptPreview';
import type { BoxOfficeManualSaleResult, BoxOfficePaymentType } from '@/services/boxOffice.service';
import { SeatMapViewer } from '@/components/seats/SeatMapViewer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import type { Seat } from '@/types';
import { showtimesService } from '@/services/showtimes.service';
import { seatsService } from '@/services/seats.service';
import { useApiResource } from '@/hooks/useApiResource';
import { normalizeSeat } from '@/utils/apiAdapters';

export function SellTicketPage() {
  const [showtimeId, setShowtimeId] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('Gişe misafiri');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentType, setPaymentType] = useState<BoxOfficePaymentType>('CASH');
  const [lastSale, setLastSale] = useState<BoxOfficeManualSaleResult | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  const showtimesQuery = useApiResource(['box-office-sale-showtimes'], () => showtimesService.list({ status: 'ON_SALE' }));
  const showtimes = showtimesQuery.data?.data ?? [];
  useEffect(() => { if (!showtimeId && showtimes[0]) setShowtimeId(showtimes[0].id); }, [showtimeId, showtimes]);
  const showtime = showtimes.find((show) => show.id === showtimeId);
  const seatsQuery = useApiResource(['box-office-sale-seats', showtimeId], async () => {
    if (!showtimeId) return [];
    const response = await seatsService.availability(showtimeId);
    return (response.seats ?? []).map(normalizeSeat);
  }, [], { enabled: Boolean(showtimeId), refetchInterval: 15_000 });
  const seats = seatsQuery.data?.data ?? [];
  const selectedSeats = useMemo(() => seats.filter((seat) => selectedCodes.includes(seat.code)), [seats, selectedCodes]);

  const toggleSeat = (seat: Seat) => { setSelectedCodes((current) => current.includes(seat.code) ? current.filter((code) => code !== seat.code) : [...current, seat.code]); setLastSale(null); setActiveStep(1); };
  const handleSaleComplete = (result: BoxOfficeManualSaleResult) => { setLastSale(result); setActiveStep(4); };

  if (showtimesQuery.isLoading) return <LoadingState text="Gişe için backend seansları yükleniyor..." />;
  if (showtimesQuery.isError) return <ErrorState title="Seanslar yüklenemedi" text={(showtimesQuery.error as Error).message} />;

  return (
    <main className="space-y-6"><motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-3"><p className="text-sm uppercase tracking-[.28em] text-theater-gold">Manuel satış desk</p><div className="flex flex-wrap items-end justify-between gap-3"></div></motion.header><ManualSaleStepper active={activeStep} />
      <section className="grid gap-6 xl:grid-cols-[1fr_380px]"><div className="space-y-6"><Card><CardContent className="grid gap-4 p-5 md:grid-cols-3"><Select label="Etkinlik / seans" value={showtimeId} onChange={(event) => { setShowtimeId(event.target.value); setSelectedCodes([]); }}><option value="">Select backend showtime</option>{showtimes.map((show) => { const item = typeof show.event === 'string' ? show.event : show.event.title; return <option key={show.id} value={show.id}>{item} · {show.startTime}</option>; })}</Select><Input label="Müşteri adı" value={customerName} onChange={(event) => { setCustomerName(event.target.value); setActiveStep(2); }} icon={<UserPlus size={16} />} /><Input label="Müşteri telefonu" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></CardContent></Card>
          {seatsQuery.isLoading ? <LoadingState text="Backend koltukları yükleniyor..." /> : seatsQuery.isError ? <ErrorState title="Koltuklar yüklenemedi" text={(seatsQuery.error as Error).message} /> : seats.length ? <SeatMapViewer seats={seats} selected={selectedCodes} onToggle={toggleSeat} /> : <EmptyState title="Koltuk dönmedi" text="Bu seans/salon için backendde koltukları oluştur." />}
          <Card><CardContent className="space-y-4 p-5"><p className="text-xs uppercase tracking-[.28em] text-theater-gold">Ödeme mode</p><div className="grid gap-3 md:grid-cols-3">{['CASH', 'CARD', 'COMPLIMENTARY'].map((method) => <button key={method} onClick={() => { setPaymentType(method as BoxOfficePaymentType); setActiveStep(3); setLastSale(null); }} className={`rounded-3xl border p-5 text-left transition-all ${paymentType === method ? 'border-theater-gold bg-theater-gold/10 text-theater-gold shadow-glow' : 'border-white/10 bg-white/[.035] text-white/65 hover:border-theater-gold/40'}`}><CreditCard className="mb-4" size={20} /><strong>{method}</strong><p className="mt-1 text-xs text-white/45">{method === 'CASH' ? 'Kasa fişi' : method === 'CARD' ? 'POS / kart ödemesi' : 'Sıfır tutarlı bilet'}</p></button>)}</div></CardContent></Card></div>
        <PaymentReceiptPreview selectedSeats={selectedSeats} showtime={showtime} paymentType={paymentType} customerName={customerName} customerPhone={customerPhone} onSaleComplete={handleSaleComplete} />
      </section><div className="flex flex-wrap items-center justify-between gap-3">{lastSale ? <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"><CheckCircle2 size={17} /> Booking {lastSale.booking.bookingNumber} generated and sent to print.</div> : <span className="text-sm text-white/45">Use the receipt preview button to create the backend booking and payment.</span>}<div className="flex flex-wrap justify-end gap-3"><Button onClick={() => setActiveStep(4)} disabled={!lastSale}><TicketCheck size={17} /> Sale completed</Button></div></div></main>
  );
}
