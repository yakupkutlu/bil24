import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { useToast } from '@/components/ui/ToastProvider';

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const { showToast } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setApiMessage(null);
    if (form.password !== form.confirmPassword) {
      setApiMessage('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password });
      setSession(response.user, response.accessToken);
      showToast('Hesap canlı backend API ile oluşturuldu.');
      navigate('/customer/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kayıt başarısız';
      setApiMessage(message);
      showToast('Backend kaydı başarısız oldu. Backend doğrulamasını ve API URL değerini kontrol et.', 'error');
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <h1 className="font-serif text-4xl text-white">Tiatru’ya katıl</h1>
          <p className="mt-2 text-white/60">Backend registration only. Kullanıcılar are created by the API.</p>
          <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
            <Input label="Ad soyad" required value={form.fullName} onChange={(event) => update('fullName', event.target.value)} />
            <Input label="E-posta" type="email" required value={form.email} onChange={(event) => update('email', event.target.value)} />
            <Input label="Telefon" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
            <Input label="Şifre" type="password" required value={form.password} onChange={(event) => update('password', event.target.value)} />
            <Input label="Şifreyi onayla" type="password" required value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} />
            <label className="text-sm text-white/60 md:col-span-2"><input type="checkbox" className="mr-2" required /> Şartları ve pazarlama iznini kabul ediyorum.</label>
            {apiMessage && <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-3 text-sm text-yellow-100 md:col-span-2">{apiMessage}</div>}
            <Button className="md:col-span-2" disabled={loading}>{loading ? 'Backend hesabı oluşturuluyor...' : 'Canlı API ile kayıt ol'}</Button>
          </form>
          <p className="mt-5 text-center text-sm text-white/60"><Link to="/login" className="text-theater-gold">Zaten hesabım var</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}
