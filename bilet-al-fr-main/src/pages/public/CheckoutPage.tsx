import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Banknote, CreditCard, LockKeyhole, ShieldCheck, Smartphone, TicketCheck, WifiOff } from 'lucide-react';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { BookingCountdown } from '@/components/checkout/BookingCountdown';
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import { PaymentMethodCard } from '@/components/checkout/PaymentMethodCard';
import { TicketPreview } from '@/components/tickets/TicketPreview';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useBookingStore } from '@/stores/booking.store';
import { bookingsService } from '@/services/bookings.service';
import { paymentsService } from '@/services/payments.service';
import { useToast } from '@/components/ui/ToastProvider';
import { listPayload, normalizeTicket } from '@/utils/apiAdapters';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    selectedEvent,
    selectedShowtime,
    selectedSeats,
    seatHoldExpiresAt,
    customerInfo,
    paymentMethod,
    priceSummary,
    setCustomerInfo,
    setPaymentMethod,
    completeBooking
  } = useBookingStore();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedShowtime) throw new Error('Seans seçilmedi.');
      const booking = await bookingsService.create({
        showtimeId: selectedShowtime.id,
        seatCodes: selectedSeats.map((seat) => seat.code),
        source: paymentMethod === 'BOX_OFFICE' ? 'BOX_OFFICE' : 'ONLINE',
        customerInfo,
        subtotal: priceSummary.subtotal,
        serviceFee: priceSummary.serviceFee,
        discount: priceSummary.discount,
        tax: priceSummary.tax,
        total: priceSummary.total
      });
      const provider = paymentMethod === 'BOX_OFFICE' ? 'CASH' : paymentMethod === 'CARD' ? 'IYZICO' : 'MOCK';
      const method = paymentMethod === 'BOX_OFFICE' ? 'CASH' : 'CARD';
      const payment = await paymentsService.checkout({
        bookingId: booking.id,
        provider,
        method,
        amount: priceSummary.total,
        currency: 'TRY',
        source: paymentMethod === 'BOX_OFFICE' ? 'BOX_OFFICE' : 'ONLINE',
        returnUrl: `${window.location.origin}/payment/success?bookingId=${encodeURIComponent(booking.id)}`,
        callbackUrl: `${window.location.origin}/payment/callback?bookingId=${encodeURIComponent(booking.id)}`
      });
      const tickets = listPayload(payment.tickets).map(normalizeTicket);
      return { booking, payment, tickets };
    },
    onSuccess: ({ booking, payment, tickets }) => {
      completeBooking({ bookingId: booking.id, bookingNumber: booking.bookingNumber, paymentId: payment.id, tickets });
      const redirectUrl = payment.redirectUrl || payment.paymentUrl || payment.checkoutUrl;
      if (redirectUrl && paymentMethod === 'CARD') {
        showToast('Ödeme sağlayıcı oturumu oluşturuldu. Güvenli ödeme sayfasına yönlendiriliyor.');
        window.location.assign(redirectUrl);
        return;
      }
      showToast('Rezervasyon, ödeme ve bilet akışı canlı backend API ile tamamlandı.');
      navigate(`/payment/success?bookingId=${encodeURIComponent(booking.id)}&paymentId=${encodeURIComponent(payment.id)}`);
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Ödeme başarısız oldu. Backend gerekli.', 'error');
    }
  });

  if (!selectedShowtime || selectedSeats.length === 0) {
    return <Navigate to={selectedShowtime?.id ? `/showtimes/${selectedShowtime.id}/seats` : '/events'} replace />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-xl backdrop-blur md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[.32em] text-theater-gold">Ödeme</p>
            <h1 className="mt-2 font-serif text-5xl text-white">Biletin hazırlanıyor</h1>
            <p className="mt-3 max-w-2xl text-white/60">Son adım: bilgilerini onayla, ödeme yöntemini seç ve geceye hazır ol.</p>
          </div>
          <BookingCountdown expiresAt={seatHoldExpiresAt} compact />
        </div>
        <div className="mt-6"><CheckoutProgress active={2} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_410px]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} className="space-y-6">
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-theater-gold/15 text-theater-gold"><TicketCheck /></div>
                <div><h2 className="font-serif text-3xl text-white">Seyirci bilgileri</h2><p className="text-sm text-white/55">QR bilet bu bilgilere göre oluşturulur.</p></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Ad Soyad" value={customerInfo.fullName} onChange={(event) => setCustomerInfo({ fullName: event.target.value })} />
                <Input label="Telefon" value={customerInfo.phone} onChange={(event) => setCustomerInfo({ phone: event.target.value })} />
                <Input label="E-posta" value={customerInfo.email} onChange={(event) => setCustomerInfo({ email: event.target.value })} />
                <Input label="İndirim kodu" placeholder="TIATRU10" value={customerInfo.discountCode} onChange={(event) => setCustomerInfo({ discountCode: event.target.value })} />
              </div>
              <Textarea label="Not" placeholder="Özel bir giriş notu veya erişilebilirlik isteği varsa yazabilirsin." value={customerInfo.note ?? ''} onChange={(event) => setCustomerInfo({ note: event.target.value })} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="mb-1 flex items-center gap-3 text-theater-ivory"><CreditCard className="text-theater-gold" /><div><h3 className="font-serif text-3xl">Ödeme yöntemi</h3><p className="text-sm text-white/55">Prodüksiyon akışı rezervasyon oluşturur, ödeme sağlayıcısını başlatır ve ardından QR/PDF biletleri döndürür.</p></div></div>
              <div className="grid gap-3 md:grid-cols-3">
                <PaymentMethodCard title="Online Ödeme" description="Sağlayıcı yönlendirmesi hazır" icon={<Smartphone size={20} />} selected={paymentMethod === 'CARD'} onClick={() => setPaymentMethod('CARD')} />
                <PaymentMethodCard title="Gişede Ödeme" description="Rezervasyon 24 saat once odemesi lazim" icon={<Banknote size={20} />} selected={paymentMethod === 'BOX_OFFICE'} onClick={() => setPaymentMethod('BOX_OFFICE')} />
              </div>
              {checkoutMutation.isError && <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-3 text-sm text-yellow-100"><WifiOff className="mr-2 inline" size={16} />Canlı ödeme başarısız oldu. Backend gerekli; backend ödeme akışı başarılı olmalı.</div>}
              <label className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/65"><input type="checkbox" defaultChecked /> Satış, iptal ve salon giriş koşullarını kabul ediyorum.</label>
              <Button size="lg" className="w-full md:w-auto" onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}>{checkoutMutation.isPending ? 'Backend ödeme akışı çalışıyor...' : `Ödemeyi tamamla · ${priceSummary.total} TRY`}</Button>
            </CardContent>
          </Card>
        </motion.div>

        <aside className="space-y-6">
          <TicketPreview event={selectedEvent} showtime={selectedShowtime} seats={selectedSeats} total={priceSummary.total} />
          <CheckoutSummary showtime={selectedShowtime} seats={selectedSeats} summary={priceSummary} />
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[.045] p-4 text-sm text-white/55">
            <p className="flex items-center gap-2 font-semibold text-theater-ivory"><ShieldCheck size={16} className="text-emerald-300" /> Güven akışı</p>
            <p className="mt-2">Ödeme başarılı olunca booking oluşturulur, koltuklar SOLD olur, QR token üretilir ve kullanıcı biletine yönlendirilir.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
