import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { RefundFlowCard } from '@/components/customer/RefundFlowCard';
import { bookingsService } from '@/services/bookings.service';
import { refundsService } from '@/services/refunds.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useToast } from '@/components/ui/ToastProvider';

export function CustomerRefundsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [bookingId, setBookingId] = useState('');
  const [reason, setReason] = useState('');
  const bookingsQuery = useApiResource(['refund-booking-options'], () => bookingsService.my());
  const refundsQuery = useApiResource(['customer-refunds'], () => refundsService.list());
  const bookings = bookingsQuery.data?.data ?? [];
  const refunds = refundsQuery.data?.data ?? [];
  useEffect(() => { if (!bookingId && bookings[0]) setBookingId(bookings[0].id); }, [bookingId, bookings]);

  const refundMutation = useMutation({
    mutationFn: () => refundsService.create({ bookingId, reason }),
    onSuccess: () => { showToast('İade talebi backende gönderildi.'); setReason(''); queryClient.invalidateQueries({ queryKey: ['customer-refunds'] }); },
    onError: (error) => showToast(error instanceof Error ? error.message : 'İade talebi başarısız oldu.', 'error')
  });

  function submit(event: FormEvent) { event.preventDefault(); if (!bookingId || !reason.trim()) return; refundMutation.mutate(); }

  if (bookingsQuery.isLoading || refundsQuery.isLoading) return <LoadingState text="Backend iadeleri yükleniyor..." />;
  if (bookingsQuery.isError) return <ErrorState title="Rezervasyonlar yüklenemedi" text={(bookingsQuery.error as Error).message} />;
  if (refundsQuery.isError) return <ErrorState title="İadeler yüklenemedi" text={(refundsQuery.error as Error).message} />;

  return <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[420px_1fr]"><Card className="h-fit"><CardContent className="space-y-5 p-6"><p className="flex items-center gap-2 text-sm uppercase tracking-[.28em] text-theater-gold"><RotateCcw size={16}/> İadeler</p><h1 className="font-serif text-4xl text-white">İade talebi oluştur</h1><p className="text-white/60">POST /api/refunds kullanır. İade talepleri yalnızca backende gönderilir.</p><form onSubmit={submit} className="space-y-4"><Select label="Rezervasyon" value={bookingId} onChange={(e)=>setBookingId(e.target.value)}>{bookings.map((booking)=><option key={booking.id} value={booking.id}>{booking.bookingNumber} · {booking.status}</option>)}</Select><Textarea label="Sebep" value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Neden iade talep ediyorsun?" /><label className="flex gap-2 text-sm text-white/60"><input type="checkbox" required /> İade politikası şartları kabul edildi.</label><Button disabled={!bookings.length || refundMutation.isPending}>{refundMutation.isPending ? 'Gönderiliyor...' : 'İade talebi gönder'}</Button></form></CardContent></Card><section className="space-y-4"><h2 className="font-serif text-3xl text-white">İade durum zaman çizelgesi</h2>{refunds.length ? refunds.map((refund,index)=><RefundFlowCard key={refund.id} refund={refund} index={index}/>) : <EmptyState title="İade yok" text="Backend iade talebi döndürmedi." />}</section></main>;
}
