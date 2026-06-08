import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Ebilet24Logo from './Ebilet24Logo';
import Biletx from './TicketImage';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();

  const role = (searchParams.get('role') || 'customer') as import('../../types').UserRole;

  const [fullName,        setFullName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [phoneError,      setPhoneError]      = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);

  // Türk telefon formatı: 05XX XXX XX XX
  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0,4)} ${d.slice(4)}`;
    if (d.length <= 9) return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7)}`;
    return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9,11)}`;
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

  const inputBase =
    'w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition';

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left Panel – Branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-white to-sky-50 flex-col justify-between p-12 border-r border-blue-100">
        {/* Logo */}
        <div>
          <Ebilet24Logo className="w-full max-w-sm" />
        </div>



           {/* Biletx */}
        <div>
          <Biletx count={1} className="w-full" />
        </div>

        
           {/* Biletx */}
        <div>
          <Biletx count={2} className="w-full" />
        </div>
        

        
           {/* Biletx */}
        <div>
          <Biletx count={3} className="w-full" />
        </div>
        
        
        {/* Feature list */}
        <div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
            {[
              'Kolayca hesap oluşturun',
              'Anında bilet satışına başlayın',
              'Güvenli ve hızlı işlemler',
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 mb-4 last:mb-0">
                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <p className="text-blue-800 font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom decorative ticket */}
        <div className="flex justify-center">
          <div className="w-full bg-blue-700 rounded-2xl p-5 shadow-lg">
            <svg viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
              <rect x="5" y="5" width="310" height="120" rx="10"
                    fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.30)" strokeWidth="1.5"/>
              <circle cx="5"   cy="65" r="10" fill="#1d4ed8"/>
              <circle cx="315" cy="65" r="10" fill="#1d4ed8"/>
              <line x1="248" y1="12" x2="248" y2="118"
                    stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="5,4"/>
              <text x="18" y="20" fontFamily="Arial" fontSize="6.5" fontWeight="bold"
                    fill="rgba(255,255,255,0.38)" letterSpacing="2">
                TICKET · TICKET · TICKET · TICKET · TICKET
              </text>
              <text x="18" y="122" fontFamily="Arial" fontSize="6.5" fontWeight="bold"
                    fill="rgba(255,255,255,0.38)" letterSpacing="2">
                TICKET · TICKET · TICKET · TICKET · TICKET
              </text>
              {/* Tragedy mask */}
              <g transform="translate(52,32)" opacity="0.6">
                <ellipse cx="18" cy="22" rx="16" ry="18"
                         fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4"/>
                <path d="M10 28 Q18 22 26 28" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"
                      fill="none" strokeLinecap="round"/>
                <circle cx="13" cy="17" r="2" fill="rgba(255,255,255,0.7)"/>
                <circle cx="23" cy="17" r="2" fill="rgba(255,255,255,0.7)"/>
              </g>
              {/* Comedy mask */}
              <g transform="translate(72,28)">
                <ellipse cx="22" cy="22" rx="19" ry="21"
                         fill="rgba(255,255,255,0.20)" stroke="white" strokeWidth="1.6"/>
                <path d="M12 28 Q22 37 32 28" stroke="white" strokeWidth="2"
                      fill="none" strokeLinecap="round"/>
                <circle cx="16" cy="17" r="2.5" fill="white"/>
                <circle cx="28" cy="17" r="2.5" fill="white"/>
              </g>
              {/* Brand */}
              <text x="125" y="89" textAnchor="middle"
                    fontFamily="'Arial Black', Arial, sans-serif"
                    fontWeight="900" fontSize="20" fill="white" letterSpacing="3">
                EBILET24
              </text>
              {/* Barcode */}
              {[0,4,8,11,15,19,23,27,30,34,38,42,46].map((x, i) => (
                <rect key={i} x={258 + x} y="30"
                      width={i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1}
                      height="55" fill="rgba(255,255,255,0.75)"/>
              ))}
              <text x="279" y="96" textAnchor="middle"
                    fontFamily="monospace" fontSize="6" fill="rgba(255,255,255,0.6)">
                0123456
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Right Panel – Register Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md my-6">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Ebilet24Logo className="w-72" />
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-blue-900 mb-1">Hesap Oluştur</h2>
            <p className="text-slate-500 text-sm mb-8">ebilet24.com'a katılın ve bilet satışına başlayın</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ad Soyad */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className={`${inputBase} border-blue-200 focus:border-blue-500`}
                    required
                  />
                </div>
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className={`${inputBase} border-blue-200 focus:border-blue-500`}
                    required
                  />
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Telefon Numarası <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="05XX XXX XX XX"
                    maxLength={14}
                    className={`${inputBase} ${
                      phoneError
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-blue-200 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>
                {phoneError ? (
                  <p className="mt-1.5 text-xs text-red-500">{phoneError}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Format: <span className="font-mono text-slate-500">05XX XXX XX XX</span>
                    {' '}— Biletiniz SMS / e-posta ile bu numaraya iletilecektir.
                  </p>
                )}
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputBase} border-blue-200 focus:border-blue-500`}
                    required
                  />
                </div>
              </div>

              {/* Şifre Onayla */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">Şifre Onayla</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputBase} border-blue-200 focus:border-blue-500`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-200"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200"/>
              <span className="text-slate-400 text-sm">veya</span>
              <div className="flex-1 h-px bg-gray-200"/>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 border border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-900 font-semibold rounded-xl transition bg-blue-50 hover:bg-blue-100"
            >
              Zaten Hesabınız Var Mı? Giriş Yapın
            </button>

            <p className="mt-6 text-center text-slate-400 text-xs">
              Kayıt olarak{' '}
              <a href="#" className="text-blue-500 hover:text-blue-700 transition">Hizmet Şartlarını</a>
              {' '}ve{' '}
              <a href="#" className="text-blue-500 hover:text-blue-700 transition">Gizlilik Politikasını</a>
              {' '}kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
