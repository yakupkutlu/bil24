import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';
import { Session } from '../../types';

export default function SessionsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState({
    event_id: '', venue_id: '', session_date: '', start_time: '', duration_minutes: 120, status: 'scheduled',
  });
  const [priceCategories, setPriceCategories] = useState([{ name: 'Standart', price: 0, capacity: 0 }]);

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions').then(r => r.data),
  });
  const { data: events } = useQuery({ queryKey: ['events-select'], queryFn: () => api.get('/events?limit=100').then(r => r.data) });
  const { data: venues } = useQuery({ queryKey: ['venues-select'], queryFn: () => api.get('/venues?limit=100').then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editing ? api.patch(`/sessions/${editing.id}`, body) : api.post('/sessions', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, price_categories: priceCategories });
  };

  const addCategory = () => setPriceCategories([...priceCategories, { name: '', price: 0, capacity: 0 }]);
  const updateCategory = (i: number, field: string, val: any) => {
    const updated = [...priceCategories];
    updated[i] = { ...updated[i], [field]: val };
    setPriceCategories(updated);
  };
  const removeCategory = (i: number) => setPriceCategories(priceCategories.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.sessions')}</h1>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">{t('sessions.addSession')}</button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('sessions.event')}</th>
                  <th>{t('sessions.venue')}</th>
                  <th>{t('sessions.date')}</th>
                  <th>{t('sessions.time')}</th>
                  <th>{t('sessions.occupancy')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.event?.title}</td>
                    <td>{s.venue?.name}</td>
                    <td>{new Date(s.session_date).toLocaleDateString('tr-TR')}</td>
                    <td>{s.start_time}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${Math.min(100, (s.sold_count / (s.capacity || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{s.sold_count}/{s.capacity}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${s.status === 'scheduled' ? 'badge-blue' : s.status === 'completed' ? 'badge-green' : 'badge-red'}`}>{t(`sessions.status.${s.status}`)}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditing(s); setForm({ event_id: s.event_id, venue_id: s.venue_id, session_date: s.session_date?.split('T')[0], start_time: s.start_time, duration_minutes: s.duration_minutes, status: s.status }); setShowModal(true); }} className="btn-sm btn-outline">{t('common.edit')}</button>
                        <button onClick={() => { if (confirm(t('common.confirmDelete'))) deleteMutation.mutate(s.id); }} className="btn-sm btn-danger">{t('common.delete')}</button>
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? t('sessions.editSession') : t('sessions.addSession')}</h2>
              <button onClick={closeModal} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('sessions.event')} *</label>
                  <select className="form-input" value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })} required>
                    <option value="">{t('common.select')}</option>
                    {(events?.data ?? []).map((ev: any) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('sessions.venue')} *</label>
                  <select className="form-input" value={form.venue_id} onChange={e => setForm({ ...form, venue_id: e.target.value })} required>
                    <option value="">{t('common.select')}</option>
                    {(venues?.data ?? []).map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('sessions.date')} *</label>
                  <input type="date" className="form-input" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">{t('sessions.time')} *</label>
                  <input type="time" className="form-input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">{t('sessions.duration')} (dk)</label>
                  <input type="number" className="form-input" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: +e.target.value })} min={1} />
                </div>
                <div>
                  <label className="form-label">{t('common.status')}</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="scheduled">{t('sessions.status.scheduled')}</option>
                    <option value="ongoing">{t('sessions.status.ongoing')}</option>
                    <option value="completed">{t('sessions.status.completed')}</option>
                    <option value="cancelled">{t('sessions.status.cancelled')}</option>
                  </select>
                </div>
              </div>

              {!editing && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label mb-0">{t('sessions.priceCategories')}</label>
                    <button type="button" onClick={addCategory} className="btn-sm btn-outline">+ {t('common.add')}</button>
                  </div>
                  {priceCategories.map((pc, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                      <input className="form-input" placeholder={t('sessions.categoryName')} value={pc.name} onChange={e => updateCategory(i, 'name', e.target.value)} />
                      <input type="number" className="form-input" placeholder={t('sessions.price')} value={pc.price} onChange={e => updateCategory(i, 'price', +e.target.value)} />
                      <div className="flex gap-1">
                        <input type="number" className="form-input" placeholder={t('venues.capacity')} value={pc.capacity} onChange={e => updateCategory(i, 'capacity', +e.target.value)} />
                        {i > 0 && <button type="button" onClick={() => removeCategory(i)} className="btn-sm btn-danger px-2">✕</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-outline">{t('common.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
