import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';
import { User } from '../../types';

export default function UsersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', is_active: true });

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editing ? api.patch(`/users/${editing.id}`, body) : api.post('/users', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, is_active: u.is_active }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { super_admin: 'badge-red', admin: 'badge-purple', operator: 'badge-blue', customer: 'badge-gray' };
    return <span className={`badge ${map[role] ?? 'badge-gray'}`}>{t(`users.roles.${role}`)}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.users')}</h1>
        <button onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'customer', is_active: true }); setShowModal(true); }} className="btn-primary">{t('users.addUser')}</button>
      </div>

      <div className="card">
        {isLoading ? <div className="text-center py-8 text-gray-400">{t('common.loading')}</div> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('users.name')}</th>
                  <th>{t('auth.email')}</th>
                  <th>{t('users.role')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.joinDate')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((u: User) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-gray-500">{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td><span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>{u.is_active ? t('common.active') : t('common.inactive')}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} className="btn-sm btn-outline">{t('common.edit')}</button>
                        <button onClick={() => { if (confirm(t('common.confirmDelete'))) deleteMutation.mutate(u.id); }} className="btn-sm btn-danger">{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(data?.data ?? []).length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-8">{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? t('users.editUser') : t('users.addUser')}</h2>
              <button onClick={closeModal} className="modal-close">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div>
                <label className="form-label">{t('users.name')} *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">{t('auth.email')} *</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">{editing ? t('auth.newPassword') : `${t('auth.password')} *`}</label>
                <input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} />
              </div>
              <div>
                <label className="form-label">{t('users.role')}</label>
                <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="customer">{t('users.roles.customer')}</option>
                  <option value="operator">{t('users.roles.operator')}</option>
                  <option value="admin">{t('users.roles.admin')}</option>
                  <option value="super_admin">{t('users.roles.super_admin')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">{t('common.active')}</label>
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
