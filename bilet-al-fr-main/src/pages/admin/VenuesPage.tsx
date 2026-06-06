import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';
import { Venue } from '../../types';

export default function VenuesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [form, setForm] = useState({
    name: '', address: '', city: '', capacity: 0,
    venue_type: 'cinema',
    // Cinema
    groups: '', rows_per_group: 5, seats_per_row: 10,
    // Table
    table_count: 10, seats_per_table: 8,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => api.get('/venues').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editing ? api.patch(`/venues/${editing.id}`, body) : api.post('/venues', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['venues'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/venues/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }),
  });

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (v: Venue) => { setEditing(v); setForm({ ...form, name: v.name, address: v.address ?? '', city: v.city ?? '', capacity: v.capacity, venue_type: v.venue_type }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.venues')}</h1>
        <button onClick={openNew} className="btn-primary">{t('venues.addVenue')}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-8 text-gray-400">{t('common.loading')}</div>
        ) : (
          (data?.data ?? []).map((v: Venue) => (
            <div key={v.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{v.name}</h3>
                  <p className="text-sm text-gray-500">{v.city}</p>
                </div>
                <span className={`badge ${v.venue_type === 'cinema' ? 'badge-blue' : 'badge-purple'}`}>
                  {t(`venues.type.${v.venue_type}`)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{v.address}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {v.capacity} {t('venues.capacity')}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(v)} className="btn-sm btn-outline">{t('common.edit')}</button>
                  <button onClick={() => { if (confirm(t('common.confirmDelete'))) deleteMutation.mutate(v.id); }} className="btn-sm btn-danger">{t('common.delete')}</button>
                </div>
              </div>
            </div>
          ))
        )}
        {(data?.data ?? []).length === 0 && !isLoading && (
          <div className="col-span-3 text-center py-8 text-gray-400">{t('common.noData')}</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? t('venues.editVenue') : t('venues.addVenue')}</h2>
              <button onClick={closeModal} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">{t('venues.name')} *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">{t('venues.city')}</label>
                  <input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">{t('venues.venueType')}</label>
                  <select className="form-input" value={form.venue_type} onChange={e => setForm({ ...form, venue_type: e.target.value })}>
                    <option value="cinema">{t('venues.type.cinema')}</option>
                    <option value="table">{t('venues.type.table')}</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="form-label">{t('venues.address')}</label>
                  <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>

              {!editing && form.venue_type === 'cinema' && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('venues.cinemaLayout')}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="form-label">{t('venues.groups')} (A,B,C)</label>
                      <input className="form-input" placeholder="A,B,C" value={form.groups} onChange={e => setForm({ ...form, groups: e.target.value })} />
                    </div>
                    <div>
                      <label className="form-label">{t('venues.rowsPerGroup')}</label>
                      <input type="number" className="form-input" value={form.rows_per_group} onChange={e => setForm({ ...form, rows_per_group: +e.target.value })} min={1} />
                    </div>
                    <div>
                      <label className="form-label">{t('venues.seatsPerRow')}</label>
                      <input type="number" className="form-input" value={form.seats_per_row} onChange={e => setForm({ ...form, seats_per_row: +e.target.value })} min={1} />
                    </div>
                  </div>
                </div>
              )}

              {!editing && form.venue_type === 'table' && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('venues.tableLayout')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">{t('venues.tableCount')}</label>
                      <input type="number" className="form-input" value={form.table_count} onChange={e => setForm({ ...form, table_count: +e.target.value })} min={1} />
                    </div>
                    <div>
                      <label className="form-label">{t('venues.seatsPerTable')}</label>
                      <input type="number" className="form-input" value={form.seats_per_table} onChange={e => setForm({ ...form, seats_per_table: +e.target.value })} min={1} />
                    </div>
                  </div>
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
