import { useEffect, useState } from 'react';
import { User, Phone, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

// Türk telefon formatı: 05XX XXX XX XX
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^05[0-9]{9}$/.test(digits);
}

export default function ProfilePage() {
  const { user, signIn } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone ? formatPhone(user.phone) : '');
    }
  }, [user]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    if (formatted && !validatePhone(formatted)) {
      setPhoneError('Geçerli bir Türkiye telefon numarası girin (05XX XXX XX XX)');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (phone && !validatePhone(phone)) {
      setPhoneError('Geçerli bir telefon numarası girin');
      return;
    }

    if (newPassword) {
      if (!currentPassword) { setErrorMsg('Yeni şifre için mevcut şifrenizi girin.'); return; }
      if (newPassword.length < 6) { setErrorMsg('Yeni şifre en az 6 karakter olmalıdır.'); return; }
      if (newPassword !== confirmPassword) { setErrorMsg('Yeni şifreler eşleşmiyor.'); return; }
    }

    setSaving(true);
    try {
      const payload: Parameters<typeof authApi.updateProfile>[0] = {
        full_name: fullName.trim() || undefined,
        phone: phone ? phone.replace(/\D/g, '') : undefined,
      };
      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      await authApi.updateProfile(payload);
      setSuccessMsg('Profil bilgileri başarıyla güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Güncelleme başarısız oldu.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil Bilgilerim</h1>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle size={18} className="shrink-0" />
          <span className="text-sm">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Kişisel Bilgiler ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={18} className="text-blue-500" /> Kişisel Bilgiler
          </h2>

          {/* E-posta (salt okunur) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-posta Adresi
            </label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">E-posta adresi değiştirilemez.</p>
          </div>

          {/* Ad Soyad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ad Soyad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Adınız Soyadınız"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              required
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefon Numarası
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="05XX XXX XX XX"
                maxLength={14}
                className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm ${
                  phoneError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {phoneError ? (
              <p className="mt-1 text-xs text-red-500">{phoneError}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                ✱ Biletiniz SMS / e-posta yoluyla bu numaraya iletilecektir.
              </p>
            )}
          </div>
        </div>

        {/* ── Şifre Değiştir ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock size={18} className="text-blue-500" /> Şifre Değiştir
          </h2>
          <p className="text-xs text-gray-400 -mt-2">Şifrenizi değiştirmek istemiyorsanız bu alanları boş bırakın.</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mevcut Şifre
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Yeni Şifre
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Yeni Şifre Tekrar
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Şifreler eşleşmiyor</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !!phoneError}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
