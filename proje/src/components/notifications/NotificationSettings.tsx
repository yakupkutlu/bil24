import React, { useEffect, useState } from 'react';
import {
  Save,
  Mail,
  MessageSquare,
  Bell,
  Loader,
  AlertCircle,
  Check,
} from 'lucide-react';
import { notificationApi } from '../../lib/api';
import { cn } from '../../lib/utils';

interface NotificationSettings {
  id?: string;
  email_enabled: boolean;
  email_from: string;
  sms_enabled: boolean;
  sms_api_key: string;
  sms_sender_name: string;
  send_ticket_info: boolean;
  send_reminder: boolean;
  send_cancellation_notice: boolean;
  reminder_hours_before: number;
  created_at?: string;
  updated_at?: string;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    email_from: 'noreply@biletos.com',
    sms_enabled: false,
    sms_api_key: '',
    sms_sender_name: '',
    send_ticket_info: true,
    send_reminder: true,
    send_cancellation_notice: true,
    reminder_hours_before: 24,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  async function fetchSettings() {
    setLoading(true);
    try {
      const data = await notificationApi.get();
      if (data) setSettings(data as NotificationSettings);
    } catch (error) {
      console.error('Bildirim ayarları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await notificationApi.update({
        email_enabled: settings.email_enabled,
        email_from: settings.email_from,
        sms_enabled: settings.sms_enabled,
        sms_api_key: settings.sms_api_key,
        sms_sender_name: settings.sms_sender_name,
        send_ticket_info: settings.send_ticket_info,
        send_reminder: settings.send_reminder,
        send_cancellation_notice: settings.send_cancellation_notice,
        reminder_hours_before: settings.reminder_hours_before,
      });
      if (updated) setSettings(updated as NotificationSettings);
      setSaveSuccess(true);
    } catch (error) {
      console.error('Bildirim ayarları kaydedilirken hata:', error);
      alert('Bildirim ayarları kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  }

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );

  const SettingSection = ({
    icon: Icon,
    title,
    description,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">
          {Icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bildirim Ayarları
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          E-posta ve SMS bildirimleri yapılandırın
        </p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg flex items-center gap-3">
          <Check className="text-green-600 dark:text-green-400" size={20} />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Bildirim ayarları başarıyla kaydedildi
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Email Settings */}
        <SettingSection
          icon={<Mail size={24} />}
          title="E-posta Bildirimleri"
          description="E-posta bildirimleri gönderme ayarlarını yapılandırın"
        >
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                E-posta bildirimleri etkinleştir
              </span>
              <ToggleSwitch
                checked={settings.email_enabled}
                onChange={(checked) =>
                  setSettings({ ...settings, email_enabled: checked })
                }
              />
            </label>
          </div>

          {settings.email_enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Gönderen E-posta Adresi
              </label>
              <input
                type="email"
                value={settings.email_from}
                onChange={(e) =>
                  setSettings({ ...settings, email_from: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </SettingSection>

        {/* SMS Settings */}
        <SettingSection
          icon={<MessageSquare size={24} />}
          title="SMS Bildirimleri"
          description="SMS bildirimleri gönderme ayarlarını yapılandırın"
        >
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                SMS bildirimleri etkinleştir
              </span>
              <ToggleSwitch
                checked={settings.sms_enabled}
                onChange={(checked) =>
                  setSettings({ ...settings, sms_enabled: checked })
                }
              />
            </label>
          </div>

          {settings.sms_enabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  SMS API Anahtarı
                </label>
                <input
                  type="password"
                  value={settings.sms_api_key}
                  onChange={(e) =>
                    setSettings({ ...settings, sms_api_key: e.target.value })
                  }
                  placeholder="API anahtarınızı girin"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  SMS Gönderen Adı
                </label>
                <input
                  type="text"
                  value={settings.sms_sender_name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sms_sender_name: e.target.value,
                    })
                  }
                  placeholder="Şirket adı veya logosu"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </SettingSection>

        {/* Notification Types */}
        <SettingSection
          icon={<Bell size={24} />}
          title="Bildirim Türleri"
          description="Hangi türdeki bildirimlerin gönderileceğini seçin"
        >
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.send_ticket_info}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    send_ticket_info: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Bilet bilgisi gönder
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.send_reminder}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    send_reminder: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Etkinlik hatırlatma gönder
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.send_cancellation_notice}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    send_cancellation_notice: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                İptal/erteleme bildirimi gönder
              </span>
            </label>
          </div>

          {settings.send_reminder && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Kaç saat önce hatırlat
              </label>
              <select
                value={settings.reminder_hours_before}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reminder_hours_before: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 saat önce</option>
                <option value={2}>2 saat önce</option>
                <option value={6}>6 saat önce</option>
                <option value={12}>12 saat önce</option>
                <option value={24}>1 gün önce</option>
                <option value={48}>2 gün önce</option>
                <option value={72}>3 gün önce</option>
              </select>
            </div>
          )}
        </SettingSection>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">Bildirim Ayarları Hakkında:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>E-posta ve SMS bildirimleri bağımsız olarak etkinleştirilebilir</li>
            <li>API anahtarlarını güvenli bir şekilde saklanır</li>
            <li>Tüm değişiklikler anında etkili olur</li>
          </ul>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? (
            <Loader size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
          <span>{saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</span>
        </button>
      </div>
    </div>
  );
}
