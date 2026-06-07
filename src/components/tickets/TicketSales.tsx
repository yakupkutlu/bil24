import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { eventsApi, sessionsApi, ticketsApi, pricingApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Event, Hall, PaymentMethod, PricingCategory, PricingSettings, Seat, Session, Ticket, PAYMENT_METHOD_LABELS } from '../../types';
import { generateQRData, generateTicketCode, calculatePrice, formatCurrency, formatDate, formatTime } from '../../lib/utils';
import HallSeatMap from '../halls/HallSeatMap';
import { ChevronRight, ChevronLeft, Check, Download, Printer, Search, X, Tag } from 'lucide-react';

const TIER_META: Record<string, { icon: string; gradient: string; border: string; selectedBorder: string }> = {
  Gold:   { icon: '🥇', gradient: 'from-yellow-50 to-amber-50',  border: 'border-yellow-200', selectedBorder: 'border-yellow-500' },
  Silver: { icon: '🥈', gradient: 'from-gray-50 to-slate-100',   border: 'border-gray-200',   selectedBorder: 'border-gray-500'   },
  Bronze: { icon: '🥉', gradient: 'from-orange-50 to-amber-100', border: 'border-orange-200', selectedBorder: 'border-orange-500' },
};

type Step = 1 | 2 | 3 | 4;

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

type SessionWithRelations = Omit<Session, 'event' | 'hall'> & {
  event?: Event;
  hall?: Hall;
};

interface TicketDisplayData {
  ticket: Ticket;
  seatLabel?: string;
  qrDataUrl?: string;
}

// ─── Bilet Kartı Bileşeni ─────────────────────────────────────────────────────

function TicketCard({
  data,
  session,
}: {
  data: TicketDisplayData;
  session: SessionWithRelations;
}) {
  const { ticket, seatLabel, qrDataUrl } = data;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `bilet-${ticket.ticket_code}.png`;
      link.click();
    } catch {
      // Fallback: QR tek başına indir
      if (qrDataUrl) {
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `qr-${ticket.ticket_code}.png`;
        link.click();
      }
    }
  };

  const handlePrint = () => {
    const win = window.open('', '', 'width=800,height=700');
    if (!win) return;

    const sDate = session.session_date ? new Date(session.session_date) : null;
    const printDayName  = sDate ? sDate.toLocaleDateString('tr-TR', { weekday: 'long' }) : '';
    const printMonth    = sDate ? sDate.toLocaleDateString('tr-TR', { month: 'long' }) : '';
    const printDay      = sDate?.getDate() ?? '';
    const printYear     = sDate?.getFullYear() ?? '';
    const printTime     = session.start_time?.slice(0, 5) ?? '';
    const priceStr      = formatCurrency(Number(ticket.total_amount));
    const qrImg         = qrDataUrl
      ? `<img src="${qrDataUrl}" alt="QR" width="130" height="130" />`
      : `<div style="width:130px;height:130px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:11px;color:#aaa;">QR</div>`;

    win.document.write(`<!DOCTYPE html>
<html lang="tr"><head>
<meta charset="UTF-8">
<title>Bilet — ${ticket.ticket_code}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;background:#f0f0f0;padding:24px;color:#222}
  .page{max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.12)}
  /* ── ticket ── */
  .ticket{display:flex;border-bottom:2px dashed #ddd}
  .t-left{background:#f8f8f8;border-right:2px dashed #ccc;padding:24px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:180px;gap:12px}
  .pnr-lbl{font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:1px;text-align:center;margin-top:4px}
  .pnr-val{font-family:monospace;font-size:11px;font-weight:bold;color:#555;text-align:center}
  .t-right{flex:1;padding:22px 24px;display:flex;flex-direction:column;justify-content:space-between}
  .ev-title{font-size:19px;font-weight:bold;color:#111;line-height:1.2;margin-bottom:4px}
  .cust-name{font-size:15px;font-weight:700;color:#f97316;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;border-top:1px solid #eee;padding-top:12px}
  .lbl{font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
  .day-num{font-size:30px;font-weight:bold;color:#111;line-height:1}
  .month{font-size:11px;color:#666;margin-top:3px}
  .badge{display:inline-block;background:#f97316;color:#fff;font-size:12px;font-weight:bold;padding:4px 14px;border-radius:20px;margin-top:2px}
  .val{font-size:12px;font-weight:500;color:#444}
  .price-row{display:flex;justify-content:flex-end;border-top:1px solid #eee;padding-top:10px;margin-top:12px}
  .price-lbl{font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;text-align:right}
  .price-val{font-size:22px;font-weight:bold;color:#111;text-align:right}
  /* ── rules ── */
  .rules{padding:18px 24px 22px}
  .rules-title{font-size:13px;font-weight:bold;background:#1d4ed8;color:#fff;display:inline-block;padding:5px 14px;border-radius:5px;margin-bottom:12px}
  .rules ul{list-style:none;padding:0}
  .rules li{font-size:11px;color:#555;line-height:1.65;padding:2px 0}
  .rules li::before{content:"— "}
  @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0}}
</style>
</head>
<body>
<div class="page">
  <div class="ticket">
    <div class="t-left">
      ${qrImg}
      <div class="pnr-lbl">PNR</div>
      <div class="pnr-val">${ticket.ticket_code}</div>
    </div>
    <div class="t-right">
      <div>
        <div class="ev-title">${session.event?.title ?? '—'}</div>
        <div class="cust-name">${ticket.customer_name}</div>
        <div class="grid">
          <div>
            <div class="lbl">Tarih</div>
            <div class="day-num">${printDay}</div>
            <div class="month">${printMonth} ${printYear} · ${printDayName}</div>
          </div>
          <div>
            <div class="lbl">Saat</div>
            <span class="badge">${printTime}</span>
          </div>
          <div>
            <div class="lbl">Salon</div>
            <div class="val">📍 ${session.hall?.name ?? '—'}</div>
          </div>
          ${seatLabel ? `<div><div class="lbl">Koltuk</div><div class="val">🎫 ${seatLabel}</div></div>` : ''}
        </div>
      </div>
      <div class="price-row">
        <div>
          <div class="price-lbl">Bilet Fiyatı</div>
          <div class="price-val">${priceStr}</div>
        </div>
      </div>
    </div>
  </div>
  <div class="rules">
    <div class="rules-title">Kurallar</div>
    <ul>
      <li>Bu bilet etkinlik girişlerini kontrol etmek amacıyla dijital olarak üretilmiştir.</li>
      <li>Etkinliğin taahhüt edildiği gibi gerçekleşmesinden biletimGO sorumlu değildir.</li>
      <li>Satılan biletler nakde çevrilemez, iade alınamaz, devredilemez ve iptal edilemez.</li>
      <li>Etkinlik süresi boyunca biletinizi muhafaza ediniz. Organizatör dilediği zaman biletleri kontrol edebilir.</li>
      <li>Bilet kaybı, kopyalanması vb. durumlarda organizatör ve biletimGO herhangi bir sorumluluk kabul etmez.</li>
      <li>biletimGO'dan aldığınız bu biletin mali bir değeri yoktur. Mali değeri bulunan biletleri ve/veya faturaları organizatörden teslim alabilirsiniz.</li>
      <li>Dare Team etkinlik programında değişiklik yapma hakkını saklı tutar. Erteleme, tarih ve saat değişikliği gibi durumlara karşı etkinlik ve organizatörün iletişim kanallarını takip ediniz.</li>
    </ul>
  </div>
</div>
<script>window.onload = function(){ window.print(); }<\/script>
</body></html>`);
    win.document.close();
  };

  const sessionDate = session.session_date ? new Date(session.session_date) : null;
  const dayName = sessionDate
    ? sessionDate.toLocaleDateString('tr-TR', { weekday: 'long' })
    : '';
  const monthName = sessionDate
    ? sessionDate.toLocaleDateString('tr-TR', { month: 'long' })
    : '';

  return (
    <div className="space-y-3">
      {/* Bilet Kartı */}
      <div
        ref={cardRef}
        style={{ fontFamily: 'sans-serif', background: '#fff' }}
        className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm"
      >
        <div className="flex">
          {/* Sol Panel — QR + Kod */}
          <div className="bg-gray-50 border-r-2 border-dashed border-gray-300 flex flex-col items-center justify-center px-6 py-5 gap-3 min-w-[160px]">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR" className="w-32 h-32" />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                QR yükleniyor
              </div>
            )}
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">PNR</p>
              <p className="font-mono text-xs font-bold text-gray-700">{ticket.ticket_code}</p>
            </div>
          </div>

          {/* Sağ Panel — Etkinlik Bilgileri */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              {/* Etkinlik adı + müşteri */}
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {session.event?.title || '—'}
                </h3>
                <p className="text-base font-semibold text-orange-500 mt-0.5">
                  {ticket.customer_name}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {/* Tarih */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Tarih</p>
                  <p className="font-bold text-2xl text-gray-900 leading-none">
                    {sessionDate?.getDate()}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {monthName} {sessionDate?.getFullYear()} · {dayName}
                  </p>
                </div>

                {/* Saat */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Saat</p>
                  <span className="inline-block bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {formatTime(session.start_time)}
                  </span>
                </div>

                {/* Salon */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Salon</p>
                  <p className="font-medium text-gray-800 text-xs">
                    📍 {session.hall?.name || '—'}
                  </p>
                </div>

                {/* Koltuk */}
                {seatLabel && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Koltuk</p>
                    <p className="font-medium text-gray-800 text-xs">
                      🎫 {seatLabel}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Fiyat */}
            <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Bilet Fiyatı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(Number(ticket.total_amount))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
        >
          <Printer size={15} /> Yazdır
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
        >
          <Download size={15} /> PNG İndir
        </button>
      </div>
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function TicketSales() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);

  // Fiyat kategorileri
  const [pricingCategories, setPricingCategories] = useState<PricingCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Arama açılır menüsü
  const [eventSearch, setEventSearch] = useState<string>('');
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const eventInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedSeats, setSelectedSeats] = useState<Map<string, Seat>>(new Map());
  const [session, setSession] = useState<SessionWithRelations | null>(null);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);

  // Başarı ekranı için snapshot
  const [successData, setSuccessData] = useState<TicketDisplayData[]>([]);
  const [successSession, setSuccessSession] = useState<SessionWithRelations | null>(null);

  useEffect(() => {
    eventsApi.list(true)
      .then(setEvents)
      .catch(() => setError('Etkinlikler yüklenemedi'));
  }, []);

  // URL'den gelen event_id + session_id varsa otomatik seç ve adım 2'ye geç
  useEffect(() => {
    const paramEventId = searchParams.get('event_id');
    const paramSessionId = searchParams.get('session_id');
    if (!paramEventId || events.length === 0) return;

    const ev = events.find(e => e.id === paramEventId);
    if (!ev) return;

    setSelectedEventId(paramEventId);
    setEventSearch(ev.title);

    sessionsApi.list({ event_id: paramEventId, status: 'active' })
      .then(data => {
        const list = data as SessionWithRelations[];
        setSessions(list);
        if (!paramSessionId) return;
        const selected = list.find(s => s.id === paramSessionId);
        if (!selected) return;
        setSelectedSessionId(paramSessionId);
        setSession(selected);
        setSelectedCategoryId('');
        pricingApi.getCategories(paramSessionId)
          .then(cats => setPricingCategories(cats))
          .catch(() => setPricingCategories([]));
        setStep(2);
      })
      .catch(() => {});
  // Sadece events yüklendiğinde bir kez çalışsın
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // date boşsa sadece etkinliğe göre, doluysa ikisiyle birden filtrele
  const fetchSessions = async (eventId: string, date?: string) => {
    if (!eventId) return;
    try {
      const params: Record<string, string> = { event_id: eventId, status: 'active' };
      if (date) params.session_date = date;
      const data = await sessionsApi.list(params);
      setSessions(data as SessionWithRelations[]);
    } catch {
      setError('Seanslar yüklenemedi');
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    const selected = sessions.find(s => s.id === sessionId);
    if (!selected) return;
    setSelectedSessionId(sessionId);
    setSession(selected);
    setSelectedSeats(new Map());
    setSelectedCategoryId('');
    pricingApi.getCategories(sessionId)
      .then(cats => setPricingCategories(cats))
      .catch(() => setPricingCategories([]));
    setStep(2);
  };

  const handleSeatSelect = (seatId: string, seat: Seat) => {
    const newSeats = new Map(selectedSeats);
    if (newSeats.has(seatId)) newSeats.delete(seatId);
    else newSeats.set(seatId, seat);
    setSelectedSeats(newSeats);
  };

  const calculateTotalPrice = () => {
    if (!session || !pricingSettings) return { netPrice: 0, kdv: 0, commission: 0, total: 0 };
    const selectedCat = pricingCategories.find(c => c.id === selectedCategoryId);
    let totalNet = 0, totalKdv = 0, totalCommission = 0;
    selectedSeats.forEach(seat => {
      const basePrice = selectedCat ? Number(selectedCat.price) : session.base_price;
      const multiplier = selectedCat ? 1 : seat.price_multiplier;
      const p = calculatePrice(basePrice, pricingSettings.kdv_rate, pricingSettings.commission_rate, multiplier);
      totalNet += p.netPrice; totalKdv += p.kdvAmount; totalCommission += p.commissionAmount;
    });
    return { netPrice: totalNet, kdv: totalKdv, commission: totalCommission, total: totalNet + totalKdv + totalCommission };
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!selectedEventId) { setError('Lütfen bir etkinlik seçiniz'); return; }
      if (!selectedSessionId) { setError('Lütfen bir seans seçiniz'); return; }
    } else if (step === 2) {
      if (selectedSeats.size === 0) { setError('Lütfen en az bir koltuk seçiniz'); return; }
      setStep(3);
    } else if (step === 3) {
      if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
        setError('Lütfen tüm müşteri bilgilerini giriniz'); return;
      }
      try {
        const settings = await pricingApi.getSettings();
        setPricingSettings(settings);
        setStep(4);
      } catch {
        setError('Fiyatlandırma ayarları yüklenemedi');
      }
    }
  };

  const handleConfirmSale = async () => {
    if (!session || !pricingSettings || !user) return;
    setLoading(true);
    setError(null);
    try {
      // Koltuk bilgisini şimdi kaydet (setSelectedSeats'ten önce)
      const seatsSnapshot = new Map(selectedSeats);
      const sessionSnapshot = session;

      const selectedCat = pricingCategories.find(c => c.id === selectedCategoryId);
      const ticketsToCreate = Array.from(selectedSeats.values()).map(seat => {
        const basePrice = selectedCat ? Number(selectedCat.price) : session.base_price;
        const multiplier = selectedCat ? 1 : seat.price_multiplier;
        const p = calculatePrice(basePrice, pricingSettings.kdv_rate, pricingSettings.commission_rate, multiplier);
        return {
          session_id: session.id,
          seat_id: seat.id,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          ticket_code: generateTicketCode(),
          qr_code_data: generateQRData(),
          status: 'active' as const,
          price: p.netPrice,
          kdv_amount: p.kdvAmount,
          commission_amount: p.commissionAmount,
          total_amount: p.totalAmount,
          payment_method: paymentMethod,
          payment_status: 'successful' as const,
          sold_by: user.id,
          is_single_use: true,
        };
      });

      const created = await ticketsApi.bulkCreate(ticketsToCreate);

      // Koltukları dolu olarak işaretle
      await Promise.all(
        Array.from(seatsSnapshot.keys()).map(seatId =>
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/seats/${seatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('biletal_token')}` },
            body: JSON.stringify({ seat_status: 'occupied' }),
          })
        )
      );

      // Her bilet için QR PNG oluştur
      const displayData: TicketDisplayData[] = await Promise.all(
        created.map(async (ticket) => {
          const seat = seatsSnapshot.get(ticket.seat_id || '');
          let qrDataUrl: string | undefined;
          try {
            qrDataUrl = await QRCode.toDataURL(ticket.qr_code_data, {
              width: 300, margin: 2,
              color: { dark: '#000000', light: '#ffffff' },
            });
          } catch { /* atla */ }
          return { ticket, seatLabel: seat?.seat_label, qrDataUrl };
        })
      );

      setSuccessData(displayData);
      setSuccessSession(sessionSnapshot);
      setStep(4);

      // Formu temizle
      setSelectedSeats(new Map());
      setCustomerInfo({ name: '', email: '', phone: '' });
      setSelectedSessionId('');
      setSelectedEventId('');
      setSelectedDate('');
      setSessions([]);
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilet oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBackStep = () => {
    if (step > 1) { setStep((step - 1) as Step); setError(null); }
  };

  const handleNewSale = () => {
    setSuccessData([]);
    setSuccessSession(null);
    setPricingSettings(null);
    setEventSearch('');
    setSelectedEventId('');
    setSelectedDate('');
    setSessions([]);
    setSelectedSessionId('');
    setPricingCategories([]);
    setSelectedCategoryId('');
    setStep(1);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Bilet Satışı</h1>

      {/* Adım Göstergesi */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${s === step ? 'bg-blue-500 text-white' : s < step ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
              {s < step ? <Check size={20} /> : s}
            </div>
            {s < 4 && <div className={`h-1 flex-1 mx-2 ${s < step ? 'bg-green-500' : 'bg-gray-300'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {/* Adım 1 — Seans Seçimi */}
      {step === 1 && (
        <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Adım 1: Seans Seçimi</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aramalı etkinlik seçici */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Etkinlik</label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    ref={eventInputRef}
                    type="text"
                    value={eventSearch}
                    onChange={e => {
                      setEventSearch(e.target.value);
                      setShowEventDropdown(true);
                      // Arama değişince seçimi sıfırla
                      if (selectedEventId) {
                        setSelectedEventId('');
                        setSessions([]);
                        setSelectedSessionId('');
                        setSelectedDate('');
                      }
                    }}
                    onFocus={() => setShowEventDropdown(true)}
                    placeholder="Etkinlik ara..."
                    className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                  {selectedEventId && (
                    <button
                      onClick={() => {
                        setSelectedEventId('');
                        setEventSearch('');
                        setSessions([]);
                        setSelectedSessionId('');
                        setSelectedDate('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dropdown listesi */}
                {showEventDropdown && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {events
                      .filter(ev =>
                        !eventSearch || ev.title.toLowerCase().includes(eventSearch.toLowerCase())
                      )
                      .map(ev => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => {
                            setSelectedEventId(ev.id);
                            setEventSearch(ev.title);
                            setShowEventDropdown(false);
                            setSelectedDate('');
                            setSelectedSessionId('');
                            fetchSessions(ev.id);   // tarihsiz → hepsi gelsin
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition ${
                            selectedEventId === ev.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-800'
                          }`}
                        >
                          {ev.title}
                        </button>
                      ))}
                    {events.filter(ev => !eventSearch || ev.title.toLowerCase().includes(eventSearch.toLowerCase())).length === 0 && (
                      <p className="px-4 py-3 text-sm text-gray-400">Sonuç bulunamadı</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tarih filtresi (opsiyonel) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarih <span className="text-gray-400 font-normal text-xs">(opsiyonel)</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setSelectedSessionId('');
                  if (selectedEventId) fetchSessions(selectedEventId, e.target.value || undefined);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Dropdown dışına tıklayınca kapat */}
          {showEventDropdown && (
            <div className="fixed inset-0 z-10" onClick={() => setShowEventDropdown(false)} />
          )}

          {/* Seans listesi */}
          {selectedEventId && sessions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Seanslar
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  {selectedDate ? `${formatDate(selectedDate)} için` : 'Tümü'}
                  {' '}— {sessions.length} seans
                </span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSessionSelect(s.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedSessionId === s.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{formatTime(s.start_time)}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{formatDate(s.session_date)}</div>
                        <div className="text-sm text-gray-600 mt-1">{s.hall?.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">{formatCurrency(s.base_price)}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{s.duration_minutes} dk</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedEventId && sessions.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              {selectedDate ? 'Bu tarihte aktif seans bulunamadı' : 'Bu etkinliğe ait aktif seans bulunamadı'}
            </p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleNextStep}
              disabled={!selectedEventId || !selectedSessionId}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              İleri <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Adım 2 — Koltuk Seçimi */}
      {step === 2 && session && (
        <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Adım 2: Koltuk Seçimi</h2>
            <p className="text-sm text-gray-600">{session.event?.title} · {formatDate(session.session_date)} {formatTime(session.start_time)}</p>
          </div>
          <HallSeatMap hallId={session.hall_id} sessionId={session.id}
            selectedSeats={Array.from(selectedSeats.keys())} onSeatSelect={handleSeatSelect} interactive={true} />
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Seçilen Koltuklar:</strong> {selectedSeats.size > 0
                ? Array.from(selectedSeats.values()).map(s => s.seat_label).join(', ')
                : 'Hiçbiri'}
            </p>
          </div>
          <div className="flex justify-between">
            <button onClick={handleBackStep} className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <ChevronLeft size={20} /> Geri
            </button>
            <button onClick={handleNextStep} disabled={selectedSeats.size === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400">
              İleri <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Adım 3 — Fiyat Seçimi + Müşteri Bilgileri */}
      {step === 3 && (
        <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Adım 3: Fiyat ve Müşteri Bilgileri</h2>

          {/* Fiyat Kategorileri */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Fiyat Kategorisi</h3>
            {pricingCategories.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <Tag size={16} className="shrink-0" />
                <span>Bu seans için fiyat kategorisi tanımlanmamış.</span>
                <button
                  type="button"
                  onClick={() => navigate(`/pricing?session_id=${selectedSessionId}&event_id=${selectedEventId}`)}
                  className="ml-auto shrink-0 underline hover:text-amber-900 font-medium"
                >
                  Kategori Ekle →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pricingCategories.map(cat => {
                  const meta = TIER_META[cat.category_name] ?? {
                    icon: '🎫', gradient: 'from-blue-50 to-indigo-50',
                    border: 'border-blue-200', selectedBorder: 'border-blue-500',
                  };
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(isSelected ? '' : cat.id)}
                      className={`bg-gradient-to-br ${meta.gradient} border-2 ${isSelected ? meta.selectedBorder + ' ring-2 ring-offset-1 ring-current' : meta.border} rounded-xl p-4 text-left transition-all`}
                    >
                      <div className="text-2xl mb-1">{meta.icon}</div>
                      <div className="font-semibold text-gray-800 text-sm">{cat.category_name}</div>
                      <div className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(Number(cat.price))}</div>
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
                          <Check size={12} /> Seçildi
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {pricingCategories.length > 0 && !selectedCategoryId && (
              <p className="text-xs text-gray-400 mt-2">Kategori seçilmezse taban fiyat uygulanır.</p>
            )}
          </div>

          <div className="space-y-4">
            {(['name', 'email', 'phone'] as const).map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field === 'name' ? 'Adı Soyadı' : field === 'email' ? 'E-posta' : 'Telefon'}
                </label>
                <input type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  value={customerInfo[field]}
                  onChange={e => setCustomerInfo({ ...customerInfo, [field]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={handleBackStep} className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <ChevronLeft size={20} /> Geri
            </button>
            <button onClick={handleNextStep} className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              İleri <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Adım 4 — Özet veya Başarı */}
      {step === 4 && (
        <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Adım 4: {successData.length > 0 ? 'Biletler' : 'Özet ve Onay'}</h2>

          {/* BAŞARI EKRANI */}
          {successData.length > 0 && successSession ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Check size={24} className="text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">
                  {successData.length} adet bilet başarıyla oluşturuldu!
                </h3>
              </div>

              {successData.map((d) => (
                <TicketCard key={d.ticket.id} data={d} session={successSession} />
              ))}

              <div className="flex justify-end pt-2">
                <button onClick={handleNewSale}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
                  Yeni Satış
                </button>
              </div>
            </div>
          ) : (
            /* ÖZET EKRANI */
            <>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Koltuklar</h3>
                  <p className="text-sm text-gray-700">
                    {Array.from(selectedSeats.values()).map(s => s.seat_label).join(', ')}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Müşteri Bilgileri</h3>
                  <p className="text-sm text-gray-700">{customerInfo.name}</p>
                  <p className="text-sm text-gray-700">{customerInfo.email}</p>
                  <p className="text-sm text-gray-700">{customerInfo.phone}</p>
                  <p className="text-sm text-gray-700 mt-1"><strong>Ödeme:</strong> {PAYMENT_METHOD_LABELS[paymentMethod]}</p>
                  {selectedCategoryId && (() => {
                    const cat = pricingCategories.find(c => c.id === selectedCategoryId);
                    const meta = cat ? (TIER_META[cat.category_name] ?? { icon: '🎫' }) : null;
                    return cat && meta ? (
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Fiyat Kategorisi:</strong> {meta.icon} {cat.category_name} — {formatCurrency(Number(cat.price))}
                      </p>
                    ) : null;
                  })()}
                </div>
                {pricingSettings && (() => {
                  const price = calculateTotalPrice();
                  return (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm"><span>Net Toplam:</span><span className="font-medium">{formatCurrency(price.netPrice)}</span></div>
                      <div className="flex justify-between text-sm"><span>KDV ({pricingSettings.kdv_rate}%):</span><span className="font-medium">{formatCurrency(price.kdv)}</span></div>
                      <div className="flex justify-between text-sm"><span>Komisyon ({pricingSettings.commission_rate}%):</span><span className="font-medium">{formatCurrency(price.commission)}</span></div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="font-semibold">Toplam:</span>
                        <span className="font-bold text-lg text-blue-600">{formatCurrency(price.total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex justify-between pt-4">
                <button onClick={handleBackStep} className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <ChevronLeft size={20} /> Geri
                </button>
                <button onClick={handleConfirmSale} disabled={loading}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 font-medium">
                  {loading ? 'İşleniyor...' : 'Satışı Onayla'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
