import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';
import SeatMap from '../../components/common/SeatMap';

export default function SeatMapPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [sessionId, setSessionId] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', payment_method: 'cash' });

  const { data: sessions } = useQuery({ queryKey: ['sessions-operator'], queryFn: () => api.get('/sessions?limit=100').then(r => r.data) });

  const { data: sessionData, refetch } = useQuery({
    queryKey: ['session-seatmap', sessionId],
    queryFn: () => api.get(`/sessions/${sessionId}/seats`).then(r => r.data),
    enabled: !!sessionId,
    refetchInterval: 10000, // auto refresh every 10s
  });

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/tickets/sell', { session_id: sessionId, seat_ids: selectedSeats, ...assignForm });
    setShowAssignModal(false);
    setSelectedSeats([]);
    qc.invalidateQueries({ queryKey: ['session-seatmap', sessionId] });
  };

  const currentSession = (sessions?.data ?? []).find((s: any) => s.id === sessionId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.seatMap')}</h1>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label className="form-label">{t('sessions.session')}</label>
            <select className="form-input" value={sessionId} onChange={e => { setSessionId(e.target.value); setSelectedSeats([]); }}>
              <option value="">{t('common.select')}</option>
              {(sessions?.data ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.event?.title} — {new Date(s.session_date).toLocaleDateString('tr-TR')} {s.start_time} ({s.venue?.name})
                </option>
              ))}
            </select>
          </div>
          {sessionId && (
            <div className="flex items-end gap-2">
              <button onClick={() => refetch()} className="btn-outline btn-sm">{t('common.refresh')}</button>
              {selectedSeats.length > 0 && (
                <button onClick={() => setShowAssignModal(true)} className="btn-primary btn-sm">
                  {selectedSeats.length} {t('tickets.seat')} {t('tickets.sell')}
                </button>
              )}
            </div>
          )}
        </div>

        {sessionId && currentSession && (
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{t('venues.capacity')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currentSession.capacity}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{t('sessions.sold')}</p>
              <p className="text-xl font-bold text-green-600">{currentSession.sold_count}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{t('sessions.available')}</p>
              <p className="text-xl font-bold text-blue-600">{(currentSession.capacity ?? 0) - (currentSession.sold_count ?? 0)}</p>
            </div>
          </div>
        )}

        {sessionId && (
          <SeatMap
            seats={sessionData?.seats ?? []}
            venueType={currentSession?.venue?.venue_type ?? 'cinema'}
            selectedSeats={selectedSeats}
            onSeatSelect={setSelectedSeats}
          />
        )}

        {!sessionId && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">🪑</div>
            <p>{t('seatMap.selectSession')}</p>
          </div>
        )}
      </div>

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('tickets.manualSell')} — {selectedSeats.length} {t('tickets.seat')}</h2>
              <button onClick={() => setShowAssignModal(false)} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="form-label">{t('tickets.customerName')} *</label>
                <input className="form-input" value={assignForm.customer_name} onChange={e => setAssignForm({ ...assignForm, customer_name: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">{t('auth.email')}</label>
                <input type="email" className="form-input" value={assignForm.customer_email} onChange={e => setAssignForm({ ...assignForm, customer_email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{t('tickets.customerPhone')}</label>
                <input className="form-input" value={assignForm.customer_phone} onChange={e => setAssignForm({ ...assignForm, customer_phone: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{t('payments.paymentMethod')}</label>
                <select className="form-input" value={assignForm.payment_method} onChange={e => setAssignForm({ ...assignForm, payment_method: e.target.value })}>
                  <option value="cash">{t('payments.methods.cash')}</option>
                  <option value="credit_card">{t('payments.methods.credit_card')}</option>
                  <option value="bank_transfer">{t('payments.methods.bank_transfer')}</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn-outline">{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">{t('tickets.sell')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
