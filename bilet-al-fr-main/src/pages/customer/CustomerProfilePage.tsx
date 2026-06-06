import { FormEvent, useEffect, useState } from 'react';
import { Bell, LockKeyhole, Save, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProfileCompletionCard } from '@/components/customer/ProfileCompletionCard';
import { useAuthStore } from '@/stores/auth.store';
import { profileService } from '@/services/profile.service';
import { useApiResource } from '@/hooks/useApiResource';
import { normalizeUser } from '@/utils/apiAdapters';
import { ApiModeBadge } from '@/components/integration/ApiModeBadge';
import { useToast } from '@/components/ui/ToastProvider';

export function CustomerProfilePage() {
  const storedUser = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { showToast } = useToast();
  const profileQuery = useApiResource(['profile'], async () => normalizeUser(await profileService.getProfile()));
  const user = profileQuery.data?.data ?? storedUser;
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', language: 'tr', favoriteCategories: '' });

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      language: user.preferences?.language ?? 'tr',
      favoriteCategories: user.preferences?.favoriteCategories?.join(', ') ?? ''
    });
  }, [user]);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    try {
      const updated = normalizeUser(await profileService.updateProfile({ fullName: form.fullName, email: form.email, phone: form.phone }));
      const preferences = await profileService.updatePreferences({ language: form.language as 'tr' | 'en' | 'ar', favoriteCategories: form.favoriteCategories.split(',').map((item) => item.trim()).filter(Boolean), emailNotifications: true, smsNotifications: true });
      const merged = normalizeUser({ ...updated, preferences: preferences.preferences ?? updated.preferences });
      if (accessToken) setSession(merged, accessToken);
      showToast('Profil backend API ile güncellendi.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Profil güncelleme başarısız oldu.', 'error');
    }
  }

  return (
    <main className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-theater-gold/20 bg-gradient-to-br from-theater-red/20 via-white/[0.055] to-theater-gold/10 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3"><p className="flex items-center gap-2 text-theater-gold"><UserRound size={18} /> Private profile</p><ApiModeBadge source={profileQuery.data?.source} /></div>
        <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">Make Tiatru feel like yours.</h1>
        <p className="mt-3 max-w-2xl text-white/60">Güncelle personal information, preferences, notification channels, and password security.</p>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <div className="space-y-6">
          <ProfileCompletionCard />
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-theater-gold text-theater-black"><Bell /></span>
                <div>
                  <h2 className="font-serif text-2xl text-white">Notification mood</h2>
                  <p className="text-sm text-white/50">Choose how Tiatru reaches you.</p>
                </div>
              </div>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/70"><span>E-posta ticket reminders</span><input type="checkbox" defaultChecked /></label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/70"><span>SMS seat hold alerts</span><input type="checkbox" defaultChecked /></label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/70"><span>New show announcements</span><input type="checkbox" /></label>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-theater-gold">Personal details</p>
                <h2 className="font-serif text-3xl text-white">Hesap information</h2>
              </div>
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Ad" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} />
                  <Input label="E-posta" value={form.email} onChange={(event) => update('email', event.target.value)} />
                  <Input label="Telefon" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
                  <Input label="Doğum tarihi" type="date" />
                  <Select label="Tercih edilen dil" value={form.language} onChange={(event) => update('language', event.target.value)}>
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </Select>
                  <Input label="Favori kategoriler" value={form.favoriteCategories} onChange={(event) => update('favoriteCategories', event.target.value)} />
                </div>
                <Button><Save size={16} /> Kaydet profile</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-theater-gold"><LockKeyhole /></span>
                <div>
                  <p className="text-theater-gold">Security</p>
                  <h2 className="font-serif text-3xl text-white">Change password</h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Mevcut şifre" type="password" />
                <Input label="Yeni şifre" type="password" />
                <Input label="Yeni şifreyi onayla" type="password" />
              </div>
              <Button variant="outline"><LockKeyhole size={16} /> Güncelle password</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
