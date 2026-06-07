import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();

  const role = (searchParams.get('role') || 'customer') as import('../../types').UserRole;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Türk telefon formatı: 05XX XXX XX XX
  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    if (d.length <= 9) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
  };

  const validatePhone = (p: string) => /^05[0-9]{9}$/.test(p.replace(/\D/g, ''));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setPhoneError(formatted && !validatePhone(formatted) ? 'Geçerli format: 05XX XXX XX XX' : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(phone)) {
      setPhoneError('Geçerli bir Türkiye cep numarası girin (05XX XXX XX XX)');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor. Lütfen kontrol edin.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName, phone.replace(/\D/g, ''), role);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-between p-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">BiletOS</h1>
          <p className="text-blue-100 text-lg">Bilet Organizasyon ve Satış Sistemi</p>
        </div>

        <div className="space-y-6">
          <div className="backdrop-blur-sm bg-white/10 p-6 rounded-lg border border-blue-400/30">
            <div className="flex items-center gap-3 mb-3">
              <Check className="w-5 h-5 text-blue-300" />
              <p className="text-blue-100">Kolayca hesap oluşturun</p>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Check className="w-5 h-5 text-blue-300" />
              <p className="text-blue-100">Anında bilet satışı başlayın</p>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-blue-300" />
              <p className="text-blue-100">Güvenli ve hızlı işlemler</p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-white/5 rounded-lg backdrop-blur-sm border border-blue-400/20"></div>
          <div className="h-24 bg-white/5 rounded-lg backdrop-blur-sm border border-blue-400/20"></div>
          <div className="h-24 bg-white/5 rounded-lg backdrop-blur-sm border border-blue-400/20"></div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-6">
          {/* Mobile Branding */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">BiletOS</h1>
            <p className="text-slate-400">Bilet Organizasyon ve Satış Sistemi</p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Hesap Oluştur</h2>
            <p className="text-slate-400 mb-8">BiletOS'a katılın ve bilet satışına başlayın</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ad Soyad
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Telefon Numarası <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="05XX XXX XX XX"
                    maxLength={14}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      phoneError
                        ? 'border-red-500/70 focus:border-red-500/70 focus:ring-red-500/20'
                        : 'border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/20'
                    }`}
                    required
                  />
                </div>
                {phoneError ? (
                  <p className="mt-1.5 text-xs text-red-400">{phoneError}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Format: <span className="text-slate-400 font-mono">05XX XXX XX XX</span>
                    &nbsp;— Biletiniz SMS / e-posta ile bu numaraya iletilecektir.
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Şifre Onayla
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700/50"></div>
              <span className="text-slate-500 text-sm">veya</span>
              <div className="flex-1 h-px bg-slate-700/50"></div>
            </div>

            {/* Login Link */}
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 border border-slate-600/50 hover:border-slate-500 text-slate-300 hover:text-white font-semibold rounded-lg transition bg-slate-700/20 hover:bg-slate-700/40"
            >
              Zaten Hesabınız Var Mı? Giriş Yapın
            </button>

            {/* Terms Agreement */}
            <p className="mt-6 text-center text-slate-400 text-xs">
              Kayıt olarak{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition">
                Hizmet Şartlarını
              </a>{' '}
              ve{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition">
                Gizlilik Politikasını
              </a>{' '}
              kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
