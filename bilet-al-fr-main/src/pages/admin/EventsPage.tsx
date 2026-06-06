import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, useTranslation } from '../../utils/api';
import { Event } from '../../types';

export default function EventsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState({ title: '', slogan: '', description: '', status: 'draft' });
  const [posterFile, setPosterFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['events', search],
    queryFn: () => api.get(`/events?search=${search}`).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: async (fd: FormData) => {
      if (editing) return api.patch(`/events/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return api.post('/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });

  const openNew = () => { setEditing(null); setForm({ title: '', slogan: '', description: '', status: 'draft' }); setShowModal(true); };
  const openEdit = (ev: Event) => { setEditing(ev); setForm({ title: ev.title, slogan: ev.slogan ?? '', description: ev.description ?? '', status: ev.status }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (posterFile) fd.append('poster', posterFile);
    saveMutation.mutate(fd);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { draft: 'badge-gray', active: 'badge-green', cancelled: 'badge-red', completed: 'badge-blue' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{t(`events.status.${status}`)}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.events')}</h1>
        <button onClick={openNew} className="btn-primary">{t('events.addEvent')}</button>
      </div>

      <div className="card">
        <div className="mb-4">
          <input className="form-input max-w-xs" placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('events.title')}</th>
                  <th>{t('events.slogan')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((ev: Event) => (
                  <tr key={ev.id}>
                    <td className="font-medium">{ev.title}</td>
                    <td className="text-gray-500 dark:text-gray-400">{ev.slogan}</td>
                    <td>{statusBadge(ev.status)}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link to={`/admin/events/${ev.id}`} className="btn-sm btn-outline">{t('common.detail')}</Link>
                        <button onClick={() => openEdit(ev)} className="btn-sm btn-outline">{t('common.edit')}</button>
                        <button onClick={() => { if (confirm(t('common.confirmDelete'))) deleteMutation.mutate(ev.id); }} className="btn-sm btn-danger">{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(data?.data ?? []).length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-8">{t('common.noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? t('events.editEvent') : t('events.addEvent')}</h2>
              <button onClick={closeModal} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">{t('events.title')} *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">{t('events.slogan')}</label>
                <input className="form-input" value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{t('events.description')}</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{t('common.status')}</label>
                <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">{t('events.status.draft')}</option>
                  <option value="active">{t('events.status.active')}</option>
                  <option value="cancelled">{t('events.status.cancelled')}</option>
                  <option value="completed">{t('events.status.completed')}</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t('events.poster')}</label>
                <input type="file" accept="image/*" className="form-input" onChange={e => setPosterFile(e.target.files?.[0] ?? null)} />
              </div>
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
