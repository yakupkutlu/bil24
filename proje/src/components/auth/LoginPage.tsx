import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
              <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
              <p className="text-blue-100">Hızlı ve güvenli bilet satışı</p>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
              <p className="text-blue-100">Gerçek zamanlı rezervasyon</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
              <p className="text-blue-100">Etkinlik yönetimi kolay</p>
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

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Branding */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">BiletOS</h1>
            <p className="text-slate-400">Bilet Organizasyon ve Satış Sistemi</p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Hoş Geldiniz</h2>
            <p className="text-slate-400 mb-8">BiletOS'a giriş yapın</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700/50"></div>
              <span className="text-slate-500 text-sm">veya</span>
              <div className="flex-1 h-px bg-slate-700/50"></div>
            </div>

            {/* Register Link */}
            <button
              onClick={() => navigate('/register')}
              className="w-full py-3 px-4 border border-slate-600/50 hover:border-slate-500 text-slate-300 hover:text-white font-semibold rounded-lg transition bg-slate-700/20 hover:bg-slate-700/40"
            >
              Yeni Hesap Oluştur
            </button>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition">
                Şifremi Unuttum?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
