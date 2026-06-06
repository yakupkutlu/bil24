import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Wifi } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth.store';
import { roleHome } from '@/constants/roles';
import { authService } from '@/services/auth.service';
import { useToast } from '@/components/ui/ToastProvider';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const { showToast } = useToast();
  const [email, setEmail] = useState('customer@tiatru.com');
  const [password, setPassword] = useState('Password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setApiMessage(null);
    try {
      const response = await authService.login({ email, password, rememberMe });
      const user = response.user;
      setSession(user, response.accessToken);
      showToast('Backend API ile giriş yapıldı.');
      navigate(searchParams.get('next') || roleHome[user.role]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Giriş başarısız';
      setApiMessage(message);
      showToast('Backend girişi başarısız oldu. Backend’i, seed kullanıcıları ve .env API URL değerini kontrol et.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Tekrar hoş geldin" subtitle="Tiatru hesabına gerçek backend API üzerinden giriş yap.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="E-posta" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input label="Şifre" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="flex justify-between text-sm text-white/60">
          <label><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="mr-2" />Beni hatırla</label>
          <Link to="/forgot-password" className="text-theater-gold">Şifremi unuttum</Link>
        </div>
        {apiMessage && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{apiMessage}</div>}
        <Button className="w-full" disabled={loading}><Wifi size={16} /> {loading ? 'Backend ile giriş yapılıyor...' : 'Giriş yap'}</Button>
        <p className="text-center text-sm text-white/60">Hesabın yok mu? <Link to="/register" className="text-theater-gold">Kayıt ol</Link></p>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-12"><Card className="w-full max-w-md"><CardContent className="p-8"><h1 className="font-serif text-4xl text-white">{title}</h1><p className="mb-6 mt-2 text-white/60">{subtitle}</p>{children}</CardContent></Card></main>;
}
