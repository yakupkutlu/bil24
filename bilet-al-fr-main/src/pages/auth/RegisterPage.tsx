import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../utils/api';
import { api } from '../../utils/api';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', password_confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      navigate('/giris');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2H5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bilet Sistemi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('auth.registerSubtitle')}</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">{t('common.name')}</label>
                <input type="text" className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">{t('auth.lastName') || 'Soyad'}</label>
                <input type="text" className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="form-label">{t('auth.email')}</label>
              <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">{t('auth.password')}</label>
              <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">{t('auth.confirmPassword')}</label>
              <input type="password" className="form-input" value={form.password_confirm} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.register')}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('auth.hasAccount')}{' '}
            <Link to="/giris" className="text-primary-600 hover:underline font-medium">{t('auth.login')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
