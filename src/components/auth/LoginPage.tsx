import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Ebilet24Logo from './Ebilet24Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left Panel – Branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-white to-sky-50 flex-col justify-between p-12 border-r border-blue-100">
        {/* Logo */}
        <div>
          <Ebilet24Logo className="w-full max-w-sm" />
        </div>

        {/* Feature list */}
        <div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
            {[
              'Hızlı ve güvenli bilet satışı',
              'Gerçek zamanlı rezervasyon takibi',
              'Kolay etkinlik ve salon yönetimi',
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

      {/* ── Right Panel – Login Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Ebilet24Logo className="w-72" />
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-blue-900 mb-1">Hoş Geldiniz</h2>
            <p className="text-slate-500 mb-8 text-sm">ebilet24.com'a giriş yapın</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* E-posta */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    required
                  />
                </div>
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-200"
              >
                <LogIn className="w-5 h-5" />
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200"/>
              <span className="text-slate-400 text-sm">veya</span>
              <div className="flex-1 h-px bg-gray-200"/>
            </div>

            <button
              onClick={() => navigate('/register')}
              className="w-full py-3 px-4 border border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-900 font-semibold rounded-xl transition bg-blue-50 hover:bg-blue-100"
            >
              Yeni Hesap Oluştur
            </button>

            <div className="mt-6 text-center">
              <a href="#" className="text-slate-400 hover:text-blue-500 text-sm transition">
                Şifremi Unuttum?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
