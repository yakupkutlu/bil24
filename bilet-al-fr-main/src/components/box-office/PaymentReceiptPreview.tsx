import {
  CheckCircle2,
  Loader2,
  Printer,
  ReceiptText,
  Sparkles,
  XCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/ToastProvider';
import {
  boxOfficeService,
  type BoxOfficeManualSaleResult,
  type BoxOfficePaymentType
} from '@/services/boxOffice.service';
import type { Booking, Seat, Showtime } from '@/types';
import { money } from '@/utils/formatters';
import { ticketsService } from '@/services/tickets.service';


async function printBackendTicketPdf(ticketId: string) {
  const blob = await ticketsService.downloadBlob(ticketId);
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.src = url;

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        iframe.remove();
      }, 60_000);
    }
  };

  document.body.appendChild(iframe);
}

type Props = {
  selectedSeats: Seat[];
  showtime?: Showtime;
  paymentType: BoxOfficePaymentType;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  onSaleComplete?: (result: BoxOfficeManualSaleResult) => void;
};

type PrintableTicket = {
  id?: string;
  ticketNumber: string;
  seatCode?: string;
  qrToken?: string;
  bookingId?: string;
};

function getEvent(showtime?: Showtime) {
  return showtime && typeof showtime.event !== 'string' ? showtime.event : undefined;
}

function getHallName(showtime?: Showtime) {
  if (!showtime) return 'Büyük Sahne';
  return typeof showtime.hall === 'string' ? showtime.hall : showtime.hall.name;
}

function getShowtimeDate(showtime?: Showtime) {
  const rawDate = showtime?.date || showtime?.startTime;

  if (!rawDate) return 'Bugün';

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return String(rawDate);

  return parsed.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getShowtimeTime(showtime?: Showtime) {
  if (!showtime?.startTime) return '20:00';

  const parsed = new Date(showtime.startTime);
  if (Number.isNaN(parsed.getTime())) return showtime.startTime;

  return parsed.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function printGeneratedTicket() {
  window.setTimeout(() => window.print(), 350);
}

function buildFallbackTicketNumbers(booking?: Booking, seatCodes: string[] = []) {
  const base = booking?.bookingNumber || 'BOX-OFFICE';
  return seatCodes.map((code, index) => `${base}-${code}-${index + 1}`);
}

function buildQrValue(params: {
  ticketNumber: string;
  bookingNumber?: string;
  eventTitle: string;
  seatCode?: string;
  showtimeId?: string;
  qrToken?: string;
}) {
  return JSON.stringify({
    type: 'TIATRU_TICKET',
    ticketNumber: params.ticketNumber,
    bookingNumber: params.bookingNumber,
    event: params.eventTitle,
    seat: params.seatCode,
    showtimeId: params.showtimeId,
    token: params.qrToken || params.ticketNumber
  });
}

export function PaymentReceiptPreview({
  selectedSeats,
  showtime,
  paymentType,
  customerName,
  customerPhone,
  customerEmail,
  onSaleComplete
}: Props) {
  const { showToast } = useToast();

  const event = getEvent(showtime);
  const eventTitle = event?.title || 'Manuel satış';
  const hallName = getHallName(showtime);
  const showDate = getShowtimeDate(showtime);
  const showTime = getShowtimeTime(showtime);

  const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceFee = selectedSeats.length ? 25 : 0;
  const total = paymentType === 'COMPLIMENTARY' ? 0 : subtotal + serviceFee;

  const saleMutation = useMutation({
    mutationFn: () => {
      if (!showtime?.id) throw new Error('Lütfen önce bir seans seç.');
      if (!selectedSeats.length) throw new Error('Lütfen en az bir koltuk seç.');

      return boxOfficeService.completeManualSale({
        showtimeId: showtime.id,
        seatCodes: selectedSeats.map((seat) => seat.code),
        seats: selectedSeats.map((seat) => ({
          seatCode: seat.code,
          category: seat.category,
          price: seat.price
        })),
        customerInfo: {
          fullName: customerName || 'Gişe müşterisi',
          phone: customerPhone,
          email: customerEmail
        },
        paymentType,
        subtotal,
        serviceFee,
        total
      });
    },
    onSuccess: async (result) => {
  showToast(`Bilet oluşturuldu. Rezervasyon: ${result.booking.bookingNumber}.`, 'success');
  onSaleComplete?.(result);

  const printableTickets = result.tickets.filter((ticket) => ticket.id);

  if (!printableTickets.length) {
    showToast('Bilet oluşturuldu ancak backend yazdırılabilir bilet değeri döndürmedi.', 'error');
    return;
  }

  try {
    for (const ticket of printableTickets) {
      await printBackendTicketPdf(ticket.id);
    }
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : 'Bilet oluşturuldu ancak PDF yazdırma başarısız oldu.',
      'error'
    );
  }
},
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Bilet oluşturulamadı.', 'error');
    }
  });

  const generated = saleMutation.data;

  const printableTicketNumbers = generated?.tickets.length
    ? generated.tickets.map((ticket) => ticket.ticketNumber)
    : buildFallbackTicketNumbers(
        generated?.booking,
        selectedSeats.map((seat) => seat.code)
      );

  const printableTickets: PrintableTicket[] = generated?.tickets.length
    ? generated.tickets.map((ticket: any, index) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        seatCode: ticket.seatCode || selectedSeats[index]?.code,
        qrToken: ticket.qrToken || ticket.ticketNumber,
        bookingId: ticket.bookingId
      }))
    : selectedSeats.map((seat, index) => ({
        id: seat.code,
        ticketNumber: printableTicketNumbers[index] ?? `PENDING-${seat.code}`,
        seatCode: seat.code,
        qrToken: printableTicketNumbers[index] ?? seat.code
      }));

  const firstPreviewTicket = printableTickets[0];

  return (
    <Card className="sticky top-24 overflow-hidden print:static print:border-0 print:bg-white print:text-black">
      <div className="border-b border-dashed border-theater-gold/30 bg-theater-gold/10 px-6 py-4 print:hidden">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[.24em] text-theater-gold">
          <ReceiptText size={15} />
          Makbuz önizlemesi
        </p>
      </div>

      <CardContent className="space-y-5 p-6 print:p-0">
        <div className="print:hidden">
          <h2 className="font-serif text-3xl text-white">{eventTitle}</h2>
          <p className="text-sm text-white/50">
            {showDate} · {showTime} · {hallName}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/25 p-4 print:hidden">
          <p className="text-xs uppercase tracking-[.24em] text-white/35">Müşteri</p>
          <strong className="mt-1 block text-white">
            {customerName || 'Gişe müşterisi'}
          </strong>
          <p className="mt-1 text-sm text-white/45">Ödeme: {paymentType}</p>
          {customerPhone ? (
            <p className="mt-1 text-xs text-white/35">Phone: {customerPhone}</p>
          ) : null}
        </div>

        <div className="space-y-2 print:hidden">
          {selectedSeats.length ? (
            selectedSeats.map((seat) => (
              <div
                key={seat.code}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm"
              >
                <span className="text-white">
                  Seat {seat.code}{' '}
                  <span className="text-white/40">· {seat.category}</span>
                </span>
                <span className="text-theater-gold">
                  {paymentType === 'COMPLIMENTARY' ? money(0) : money(seat.price)}
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/45">
              Makbuz oluşturmak için koltuk seç.
            </p>
          )}
        </div>

        

        <div className="space-y-2 border-t border-white/10 pt-4 text-sm print:hidden">
          <div className="flex justify-between text-white/55">
            <span>Ara toplam</span>
            <span>{money(paymentType === 'COMPLIMENTARY' ? 0 : subtotal)}</span>
          </div>
          <div className="flex justify-between text-white/55">
            <span>Servis ücreti</span>
            <span>{money(paymentType === 'COMPLIMENTARY' ? 0 : serviceFee)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-white">
            <span>Toplam</span>
            <span className="text-theater-gold">{money(total)}</span>
          </div>
        </div>

        {generated ? (
          <div className="rounded-3xl border border-emerald-300/25 bg-emerald-500/10 p-4 print:hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                  <CheckCircle2 size={17} />
                  Bilet başarıyla oluşturuldu
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Booking: {generated.booking.bookingNumber}
                </p>

                <div className="mt-3 space-y-1 text-xs text-white/55">
                  {printableTicketNumbers.map((ticketNumber) => (
                    <p key={ticketNumber}>Ticket: {ticketNumber}</p>
                  ))}
                </div>
              </div>

              {firstPreviewTicket ? (
                <div className="rounded-2xl border border-white/10 bg-white p-2 shadow-xl">
                  <QRCodeSVG
                    value={buildQrValue({
                      ticketNumber: firstPreviewTicket.ticketNumber,
                      bookingNumber: generated.booking.bookingNumber,
                      eventTitle,
                      seatCode: firstPreviewTicket.seatCode,
                      showtimeId: showtime?.id,
                      qrToken: firstPreviewTicket.qrToken
                    })}
                    size={88}
                    level="M"
                    includeMargin
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {saleMutation.isError ? (
          <div className="rounded-3xl border border-red-300/25 bg-red-500/10 p-4 print:hidden">
            <p className="flex items-center gap-2 text-sm font-semibold text-red-200">
              <XCircle size={17} />
              Backend satışı başarısız oldu
            </p>
            <p className="mt-1 text-xs text-white/50">
              {saleMutation.error instanceof Error
                ? saleMutation.error.message
                : 'Backend loglarını ve endpoint sözleşmesini kontrol et.'}
            </p>
          </div>
        ) : null}

        <Button
          className="w-full print:hidden"
          disabled={!selectedSeats.length || !showtime?.id || saleMutation.isPending}
          onClick={() => saleMutation.mutate()}
        >
          {saleMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Printer size={16} />
          )}
          {saleMutation.isPending
            ? 'Bilet oluşturuluyor...'
            : generated
              ? 'Yeni yazdırma oluştur'
              : 'Bilet oluştur ve yazdır'}
        </Button>


        <div className="hidden print:block print-ticket-area">
          <div className="space-y-5">
            {printableTickets.map((ticket, index) => {
              const qrValue = buildQrValue({
                ticketNumber: ticket.ticketNumber,
                bookingNumber: generated?.booking.bookingNumber,
                eventTitle,
                seatCode: ticket.seatCode,
                showtimeId: showtime?.id,
                qrToken: ticket.qrToken
              });

              return (
                <section
                  key={ticket.id ?? ticket.ticketNumber}
                  className="relative overflow-hidden rounded-[28px] border border-black/20 bg-white text-black break-inside-avoid"
                >
                  <div className="absolute left-0 top-0 h-full w-3 bg-black" />
                  <div className="absolute right-0 top-0 h-full w-3 bg-black" />

                  <div className="grid grid-cols-[1fr_170px]">
                    <div className="p-7 pl-9">
                      <p className="text-[10px] font-bold uppercase tracking-[.38em] text-black/45">
                        Tiatru official ticket
                      </p>

                      <h3 className="mt-3 font-serif text-3xl font-bold leading-tight">
                        {eventTitle}
                      </h3>

                      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-black/10 bg-black/[.035] p-3">
                          <p className="text-[10px] uppercase tracking-[.22em] text-black/45">
                            Tarih
                          </p>
                          <strong>{showDate}</strong>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-black/[.035] p-3">
                          <p className="text-[10px] uppercase tracking-[.22em] text-black/45">
                            Saat
                          </p>
                          <strong>{showTime}</strong>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-black/[.035] p-3">
                          <p className="text-[10px] uppercase tracking-[.22em] text-black/45">
                            Salon
                          </p>
                          <strong>{hallName}</strong>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-black/[.035] p-3">
                          <p className="text-[10px] uppercase tracking-[.22em] text-black/45">
                            Koltuk
                          </p>
                          <strong>{ticket.seatCode || selectedSeats[index]?.code || '-'}</strong>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-dashed border-black/25 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[.22em] text-black/45">
                              Müşteri
                            </p>
                            <strong className="text-sm">
                              {customerName || 'Gişe müşterisi'}
                            </strong>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[.22em] text-black/45">
                              Ödeme
                            </p>
                            <strong className="text-sm">{paymentType}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[.22em] text-black/45">
                            Bilet numarası
                          </p>
                          <p className="font-mono text-sm font-bold">
                            {ticket.ticketNumber}
                          </p>
                          <p className="mt-1 text-[11px] text-black/45">
                            Booking: {generated?.booking.bookingNumber || 'Bekleyen backend yanıtı'}
                          </p>
                        </div>

                        <div className="rounded-full border border-black/15 px-4 py-2 text-sm font-bold">
                          {money(total)}
                        </div>
                      </div>
                    </div>

                    <aside className="flex flex-col items-center justify-between border-l border-dashed border-black/25 bg-black/[.035] p-5">
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[.28em] text-black/45">
                          QR Tara
                        </p>

                        <div className="mt-4 rounded-2xl border border-black/15 bg-white p-3">
                          <QRCodeSVG
                            value={qrValue}
                            size={124}
                            level="M"
                            includeMargin
                          />
                        </div>

                        <p className="mt-3 max-w-[130px] text-[10px] leading-relaxed text-black/50">
                          Tara this code at the entrance to validate the ticket.
                        </p>
                      </div>

                      <div className="w-full rounded-2xl bg-black p-3 text-center text-white">
                        <p className="text-[10px] uppercase tracking-[.24em] text-white/55">
                          Koltuk
                        </p>
                        <strong className="text-2xl">
                          {ticket.seatCode || selectedSeats[index]?.code || '-'}
                        </strong>
                      </div>
                    </aside>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}