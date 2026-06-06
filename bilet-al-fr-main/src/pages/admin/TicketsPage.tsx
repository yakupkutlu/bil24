import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';
import { Ticket } from '../../types';

export default function TicketsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellForm, setSellForm] = useState({ session_id: '', seat_ids: [] as string[], payment_method: 'cash', customer_name: '', customer_email: '', customer_phone: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', search, statusFilter],
    queryFn: () => api.get(`/tickets?search=${search}&status=${statusFilter}`).then(r => r.data),
  });

  const { data: sessions } = useQuery({ queryKey: ['sessions-select'], queryFn: () => api.get('/sessions?limit=100').then(r => r.data) });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tickets/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const sellMutation = useMutation({
    mutationFn: (body: any) => api.post('/tickets/sell', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets'] }); setShowSellModal(false); },
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { active: 'badge-green', used: 'badge-blue', cancelled: 'badge-red', refunded: 'badge-yellow' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{t(`tickets.status.${status}`)}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.tickets')}</h1>
        <button onClick={() => setShowSellModal(true)} className="btn-primary">{t('tickets.manualSell')}</button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input className="form-input max-w-xs" placeholder={t('tickets.searchTicket')} value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-input max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{t('common.allStatuses')}</option>
            <option value="active">{t('tickets.status.active')}</option>
            <option value="used">{t('tickets.status.used')}</option>
            <option value="cancelled">{t('tickets.status.cancelled')}</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('tickets.ticketNumber')}</th>
                  <th>{t('tickets.customer')}</th>
                  <th>{t('tickets.event')}</th>
                  <th>{t('tickets.seat')}</th>
                  <th>{t('tickets.price')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((tk: Ticket) => (
                  <tr key={tk.id}>
                    <td className="font-mono text-xs">{tk.ticket_number}</td>
                    <td>{tk.customer_name}<br /><span className="text-xs text-gray-400">{tk.customer_email}</span></td>
                    <td>{(tk as any).session?.event?.title}</td>
                    <td className="font-mono">{(tk as any).seat?.seat_label}</td>
                    <td>₺{Number(tk.price).toLocaleString('tr-TR')}</td>
                    <td>{statusBadge(tk.status)}</td>
                    <td>
                      <div className="flex gap-2">
                        {tk.status === 'active' && (
                          <button onClick={() => { if (confirm(t('common.confirmDelete'))) cancelMutation.mutate(tk.id); }} className="btn-sm btn-danger">{t('tickets.cancel')}</button>
                        )}
                        <a href={`/api/tickets/${tk.id}/download`} className="btn-sm btn-outline" target="_blank">{t('tickets.download')}</a>
                      </div>
                    </td>
                  </tr>
                ))}
                {(data?.data ?? []).length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-8">{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Sell Modal */}
      {showSellModal && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('tickets.manualSell')}</h2>
              <button onClick={() => setShowSellModal(false)} className="modal-close">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); sellMutation.mutate(sellForm); }} className="space-y-4">
              <div>
                <label className="form-label">{t('sessions.session')} *</label>
                <select className="form-input" value={sellForm.session_id} onChange={e => setSellForm({ ...sellForm, session_id: e.target.value })} required>
                  <option value="">{t('common.select')}</option>
                  {(sessions?.data ?? []).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.event?.title} — {new Date(s.session_date).toLocaleDateString('tr-TR')} {s.start_time}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('tickets.customerName')} *</label>
                  <input className="form-input" value={sellForm.customer_name} onChange={e => setSellForm({ ...sellForm, customer_name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">{t('tickets.customerPhone')}</label>
                  <input className="form-input" value={sellForm.customer_phone} onChange={e => setSellForm({ ...sellForm, customer_phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">{t('tickets.customerEmail')}</label>
                  <input type="email" className="form-input" value={sellForm.customer_email} onChange={e => setSellForm({ ...sellForm, customer_email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">{t('payments.paymentMethod')}</label>
                <select className="form-input" value={sellForm.payment_method} onChange={e => setSellForm({ ...sellForm, payment_method: e.target.value })}>
                  <option value="cash">{t('payments.methods.cash')}</option>
                  <option value="credit_card">{t('payments.methods.credit_card')}</option>
                  <option value="bank_transfer">{t('payments.methods.bank_transfer')}</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSellModal(false)} className="btn-outline">{t('common.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={sellMutation.isPending}>
                  {sellMutation.isPending ? t('common.saving') : t('tickets.sell')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
