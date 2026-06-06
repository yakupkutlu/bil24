import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, useTranslation, useAuthStore } from '../../utils/api';
import SeatMap from '../../components/common/SeatMap';

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [step, setStep] = useState<'info' | 'seats' | 'pay'>('info');
  const [payForm, setPayForm] = useState({ payment_method: 'credit_card', customer_name: user?.name ?? '', customer_email: user?.email ?? '', customer_phone: '' });

  const { data: event } = useQuery({
    queryKey: ['public-event', id],
    queryFn: () => api.get(`/events/public/${id}`).then(r => r.data),
  });

  const { data: sessions } = useQuery({
    queryKey: ['event-sessions-public', id],
    queryFn: () => api.get(`/sessions?event_id=${id}&status=scheduled`).then(r => r.data),
  });

  const { data: sessionSeats } = useQuery({
    queryKey: ['session-seats', selectedSession?.id],
    queryFn: () => api.get(`/sessions/${selectedSession.id}/seats`).then(r => r.data),
    enabled: !!selectedSession,
  });

  const purchaseMutation = useMutation({
    mutationFn: (body: any) => api.post('/tickets/purchase', body),
    onSuccess: () => navigate('/my-tickets'),
  });

  if (!event) return <div className="text-center py-16 text-gray-400">{t('common.loading')}</div>;

  const totalPrice = selectedSeats.length * (selectedSession?.price_categories?.[0]?.price ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">← {t('common.back')}</button>
          <span className="font-bold text-gray-900 dark:text-white">{event.title}</span>
          <div />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Info & Session select */}
        {step === 'info' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
              {event.poster_url && <img src={event.poster_url} alt={event.title} className="w-full h-64 object-cover" />}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{event.title}</h1>
                {event.slogan && <p className="text-primary-600 font-medium mb-3">{event.slogan}</p>}
                {event.description && <p className="text-gray-600 dark:text-gray-400">{event.description}</p>}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{t('home.sessions')}</h2>
              <div className="space-y-3">
                {(sessions?.data ?? []).map((s: any) => (
                  <button key={s.id} onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedSession?.id === s.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary-300'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{new Date(s.session_date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-gray-500">{s.start_time} — {s.venue?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{s.sold_count}/{s.capacity}</p>
                        {s.price_categories?.[0] && <p className="font-bold text-primary-600">₺{s.price_categories[0].price}</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedSession && (
              <button onClick={() => setStep('seats')} className="btn-primary w-full">{t('events.selectSeats')}</button>
            )}
          </div>
        )}

        {/* Step 2: Seats */}
        {step === 'seats' && selectedSession && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('info')} className="text-gray-500 hover:text-gray-800">←</button>
              <h2 className="font-bold text-gray-900 dark:text-white">{t('seatMap.selectSeat')}</h2>
            </div>
            <SeatMap
              seats={sessionSeats?.seats ?? []}
              venueType={selectedSession.venue?.venue_type ?? 'cinema'}
              selectedSeats={selectedSeats}
              onSeatSelect={setSelectedSeats}
            />
            {selectedSeats.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">{selectedSeats.length} {t('tickets.seat')} × ₺{selectedSession.price_categories?.[0]?.price ?? 0}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xl">₺{totalPrice.toLocaleString('tr-TR')}</span>
                  <button onClick={() => setStep('pay')} className="btn-primary">{t('tickets.continue')}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 'pay' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('seats')} className="text-gray-500 hover:text-gray-800">←</button>
              <h2 className="font-bold text-gray-900 dark:text-white">{t('payments.paymentInfo')}</h2>
            </div>
            <div className="card space-y-4">
              <div>
                <label className="form-label">{t('tickets.customerName')} *</label>
                <input className="form-input" value={payForm.customer_name} onChange={e => setPayForm({ ...payForm, customer_name: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">{t('auth.email')}</label>
                <input type="email" className="form-input" value={payForm.customer_email} onChange={e => setPayForm({ ...payForm, customer_email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{t('tickets.customerPhone')}</label>
                <input className="form-input" value={payForm.customer_phone} onChange={e => setPayForm({ ...payForm, customer_phone: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{t('payments.paymentMethod')}</label>
                <select className="form-input" value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                  <option value="credit_card">{t('payments.methods.credit_card')}</option>
                  <option value="bank_transfer">{t('payments.methods.bank_transfer')}</option>
                </select>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{selectedSeats.length} {t('tickets.seat')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{totalPrice.toLocaleString('tr-TR')}</p>
                </div>
                <button
                  onClick={() => purchaseMutation.mutate({ session_id: selectedSession.id, seat_ids: selectedSeats, payment_method: payForm.payment_method, customer_name: payForm.customer_name, customer_email: payForm.customer_email, customer_phone: payForm.customer_phone })}
                  className="btn-primary"
                  disabled={purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending ? t('common.loading') : t('payments.completePayment')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
