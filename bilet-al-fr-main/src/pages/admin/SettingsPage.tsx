import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useTranslation, useAppStore } from '../../utils/api';

export default function SettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const [tab, setTab] = useState<'general' | 'notifications' | 'ticket'>('general');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const [form, setForm] = useState({
    site_name: 'Bilet Sistemi',
    vat_rate: 18,
    commission_rate: 5,
    currency: 'TRY',
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', smtp_from: '',
    sms_provider: '', sms_api_key: '', sms_sender: '',
    send_ticket_email: true, send_ticket_sms: false,
    send_reminder_email: true, send_reminder_hours: 24,
    ticket_logo_url: '', ticket_primary_color: '#6366f1',
    qr_expires_hours: 0,
  });

  useEffect(() => {
    if (settings) setForm((prev) => ({ ...prev, ...settings }));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (body: any) => api.patch('/settings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const tabs = [
    { key: 'general', label: t('settings.general') },
    { key: 'notifications', label: t('settings.notifications') },
    { key: 'ticket', label: t('settings.ticketDesign') },
  ] as const;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.settings')}</h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab_ => (
          <button key={tab_.key} onClick={() => setTab(tab_.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === tab_.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {tab_.label}
          </button>
        ))}
      </div>

      <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }}>
        {tab === 'general' && (
          <div className="card space-y-4">
            <div>
              <label className="form-label">{t('settings.siteName')}</label>
              <input className="form-input max-w-xs" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <div>
                <label className="form-label">{t('settings.vatRate')} (%)</label>
                <input type="number" className="form-input" value={form.vat_rate} onChange={e => setForm({ ...form, vat_rate: +e.target.value })} />
              </div>
              <div>
                <label className="form-label">{t('settings.commissionRate')} (%)</label>
                <input type="number" className="form-input" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: +e.target.value })} />
              </div>
            </div>
            <div>
              <label className="form-label">{t('settings.currency')}</label>
              <select className="form-input max-w-xs" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="form-label">{t('settings.theme')}</label>
              <div className="flex gap-3">
                {[{ v: 'light', label: '☀️ ' + t('settings.light') }, { v: 'dark', label: '🌙 ' + t('settings.dark') }].map(opt => (
                  <button key={opt.v} type="button" onClick={() => setTheme(opt.v as 'light' | 'dark')}
                    className={`btn-sm ${theme === opt.v ? 'btn-primary' : 'btn-outline'}`}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">{t('settings.language')}</label>
              <div className="flex gap-3">
                {[{ v: 'tr', label: '🇹🇷 Türkçe' }, { v: 'en', label: '🇬🇧 English' }].map(opt => (
                  <button key={opt.v} type="button" onClick={() => setLanguage(opt.v as 'tr' | 'en')}
                    className={`btn-sm ${language === opt.v ? 'btn-primary' : 'btn-outline'}`}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="card space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📧 {t('settings.emailSettings')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">SMTP Host</label>
                  <input className="form-input" value={form.smtp_host} onChange={e => setForm({ ...form, smtp_host: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">SMTP Port</label>
                  <input type="number" className="form-input" value={form.smtp_port} onChange={e => setForm({ ...form, smtp_port: +e.target.value })} />
                </div>
                <div>
                  <label className="form-label">SMTP Kullanıcı</label>
                  <input className="form-input" value={form.smtp_user} onChange={e => setForm({ ...form, smtp_user: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">SMTP Şifre</label>
                  <input type="password" className="form-input" value={form.smtp_pass} onChange={e => setForm({ ...form, smtp_pass: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">{t('settings.fromEmail')}</label>
                  <input type="email" className="form-input max-w-xs" value={form.smtp_from} onChange={e => setForm({ ...form, smtp_from: e.target.value })} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">📱 {t('settings.smsSettings')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('settings.smsProvider')}</label>
                  <input className="form-input" value={form.sms_provider} onChange={e => setForm({ ...form, sms_provider: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">API Key</label>
                  <input className="form-input" value={form.sms_api_key} onChange={e => setForm({ ...form, sms_api_key: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">{t('settings.smsSender')}</label>
                  <input className="form-input" value={form.sms_sender} onChange={e => setForm({ ...form, sms_sender: e.target.value })} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{t('settings.notificationPrefs')}</h3>
              <div className="space-y-3">
                {[
                  { key: 'send_ticket_email', label: t('settings.sendTicketEmail') },
                  { key: 'send_ticket_sms', label: t('settings.sendTicketSms') },
                  { key: 'send_reminder_email', label: t('settings.sendReminderEmail') },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as any)[opt.key]} onChange={e => setForm({ ...form, [opt.key]: e.target.checked })} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </label>
                ))}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">{t('settings.reminderHours')}:</label>
                  <input type="number" className="form-input w-24" value={form.send_reminder_hours} onChange={e => setForm({ ...form, send_reminder_hours: +e.target.value })} />
                  <span className="text-sm text-gray-500">{t('settings.hours')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'ticket' && (
          <div className="card space-y-4">
            <div>
              <label className="form-label">{t('settings.ticketLogoUrl')}</label>
              <input className="form-input" value={form.ticket_logo_url} onChange={e => setForm({ ...form, ticket_logo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="form-label">{t('settings.ticketColor')}</label>
              <div className="flex items-center gap-3">
                <input type="color" className="w-12 h-10 rounded cursor-pointer border border-gray-200" value={form.ticket_primary_color} onChange={e => setForm({ ...form, ticket_primary_color: e.target.value })} />
                <input className="form-input max-w-xs" value={form.ticket_primary_color} onChange={e => setForm({ ...form, ticket_primary_color: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="form-label">{t('settings.qrExpiry')} ({t('settings.hours')}, 0 = {t('settings.noExpiry')})</label>
              <input type="number" className="form-input w-32" value={form.qr_expires_hours} onChange={e => setForm({ ...form, qr_expires_hours: +e.target.value })} min={0} />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">{t('settings.ticketPreview')}</p>
              <div className="w-64 bg-white dark:bg-gray-900 rounded-xl border-2 p-4" style={{ borderColor: form.ticket_primary_color }}>
                <div className="h-4 w-4/5 rounded mb-1" style={{ backgroundColor: form.ticket_primary_color, opacity: 0.8 }} />
                <div className="h-3 w-3/5 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded mx-auto mb-3 flex items-center justify-center text-2xl">▦</div>
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded mb-1" />
                <div className="h-3 w-4/5 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? t('common.saving') : t('common.saveChanges')}
          </button>
          {saveMutation.isSuccess && <span className="ml-3 text-sm text-green-600">✓ {t('common.saved')}</span>}
        </div>
      </form>
    </div>
  );
}
