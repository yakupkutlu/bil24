import { FormEvent, useEffect, useState } from 'react';
import { Mail, Paintbrush, Save, Shield, Smartphone, Ticket } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { AdminCrudStatus, AdminEndpointHint } from '@/components/admin/AdminCrudStatus';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { settingsService } from '@/services/settings.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import type { SistemSettings } from '@/types';

const emptySettings: SistemSettings = {
  websiteName: '',
  logo: '',
  theme: { primary: '', accent: '', mode: 'dark' },
  ticketRules: { seatHoldMinutes: 0, cancellationDeadlineHours: 0, refundAllowed: false, serviceFee: 0, taxRate: 0 },
  maintenanceMode: false
};

export function AdminSettingsPage() {
  const settingsQuery = useApiResource(['admin-settings'], settingsService.get);
  const [form, setForm] = useState(emptySettings);

  useEffect(() => {
    if (settingsQuery.data?.data) setForm(settingsQuery.data.data);
  }, [settingsQuery.data?.data]);

  const saveMutation = useAdminMutation<Partial<SistemSettings>, SistemSettings>({
    mutationFn: (payload) => settingsService.update(payload),
    successMessage: 'Sistem ayarları kaydedildi.',
    invalidate: ['admin-settings']
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate(form);
  }

  if (settingsQuery.isLoading) return <LoadingState text="Ayarlar backendden yükleniyor..." />;
  if (settingsQuery.isError) return <ErrorState title="Backend ayarları başarısız oldu" text="GET /api/settings sistem ayarları döndürmedi. Backend sistem ayarlarını sağlamalı." />;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <AdminPageHeader eyebrow="Sistem ayarları" title="Perdenin arkasındaki iş kurallarını düzenle." description="Web sitesi markasını, ödeme sağlayıcı anahtarlarını, e-posta/SMS ayarlarını, bilet kurallarını, iade politikasını, ücretleri, vergiyi ve bakım modunu yönet." actions={<><AdminCrudStatus source={settingsQuery.data?.source} isMutating={saveMutation.isPending} /><Button type="submit"><Save size={18}/> Ayarları kaydet</Button></>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSectionCard title="Marka ve tema" description="Genel web sitesi kimliği." action={<Paintbrush className="text-theater-gold" size={20}/>}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Web sitesi adı" value={form.websiteName} onChange={(e) => setForm((current) => ({ ...current, websiteName: e.target.value }))}/>
            <Input label="Logo URL’si" value={form.logo ?? ''} onChange={(e) => setForm((current) => ({ ...current, logo: e.target.value }))}/>
            <Input label="Ana renk" value={form.theme.primary} onChange={(e) => setForm((current) => ({ ...current, theme: { ...current.theme, primary: e.target.value } }))}/>
            <Input label="Altın vurgu" value={form.theme.accent} onChange={(e) => setForm((current) => ({ ...current, theme: { ...current.theme, accent: e.target.value } }))}/>
            <Select label="Mod" value={form.theme.mode} onChange={(e) => setForm((current) => ({ ...current, theme: { ...current.theme, mode: e.target.value as 'dark' | 'light' } }))}><option>dark</option><option>light</option></Select>
            <Select label="Bakım modu" value={String(form.maintenanceMode)} onChange={(e) => setForm((current) => ({ ...current, maintenanceMode: e.target.value === 'true' }))}><option value="false">false</option><option value="true">true</option></Select>
          </div>
        </AdminSectionCard>
        <AdminSectionCard title="Bilet kuralları" description="Rezervasyon, iptal, ücretler ve vergi." action={<Ticket className="text-theater-gold" size={20}/>}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Koltuk tutma süresi (dakika)" type="number" value={form.ticketRules.seatHoldMinutes} onChange={(e) => setForm((current) => ({ ...current, ticketRules: { ...current.ticketRules, seatHoldMinutes: Number(e.target.value) } }))}/>
            <Input label="İptal son tarihi (saat)" type="number" value={form.ticketRules.cancellationDeadlineHours} onChange={(e) => setForm((current) => ({ ...current, ticketRules: { ...current.ticketRules, cancellationDeadlineHours: Number(e.target.value) } }))}/>
            <Input label="Servis ücreti" type="number" value={form.ticketRules.serviceFee} onChange={(e) => setForm((current) => ({ ...current, ticketRules: { ...current.ticketRules, serviceFee: Number(e.target.value) } }))}/>
            <Input label="Vergi oranı %" type="number" value={form.ticketRules.taxRate} onChange={(e) => setForm((current) => ({ ...current, ticketRules: { ...current.ticketRules, taxRate: Number(e.target.value) } }))}/>
            <Select label="İade izni" value={String(form.ticketRules.refundAllowed)} onChange={(e) => setForm((current) => ({ ...current, ticketRules: { ...current.ticketRules, refundAllowed: e.target.value === 'true' } }))}><option value="true">true</option><option value="false">false</option></Select>
            <Select label="İadeden sonra koltuğu yeniden satışa aç"><option>true</option><option>false</option></Select>
          </div>
        </AdminSectionCard>
        <AdminSectionCard title="Ödeme sağlayıcısı" description="Gerçek kimlik bilgileri frontend’e eklenmemeli, backend .env dosyasına yazılmalı." action={<Shield className="text-theater-gold" size={20}/>}>
          <div className="grid gap-4 md:grid-cols-2"><Input label="Sağlayıcı" defaultValue="IYZICO"/><Input label="Genel anahtar takma adı" placeholder="iyzico_public_alias"/><Input label="Callback yolu" defaultValue="/api/payments/iyzico/callback"/><Input label="Sağlayıcı modu" value="Backend .env içinde yapılandırılır" readOnly /></div>
        </AdminSectionCard>
        <AdminSectionCard title="İletişim" description="E-posta ve SMS gönderim yapılandırması." action={<Mail className="text-theater-gold" size={20}/>}>
          <div className="grid gap-4 md:grid-cols-2"><Input label="E-posta sunucusu" placeholder="smtp.example.com"/><Input label="Gönderen e-posta" placeholder="tickets@tiatru.com"/><Input label="SMS sağlayıcısı" placeholder="NetGSM / Twilio"/><Input label="SMS gönderen" placeholder="TIATRU"/><Select label="E-posta bildirimleri"><option>true</option><option>false</option></Select><Select label="SMS bildirimleri"><option>true</option><option>false</option></Select></div>
        </AdminSectionCard>
      </div>
      <AdminSectionCard title="Güvenlik hatırlatmaları" description="Hassas değerleri backend ortamında tut ve tüm admin değişikliklerini denetle.">
        <div className="grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/60"><Shield className="mb-2 text-theater-gold" size={20}/> Gerçek kart verisini asla saklama.</div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/60"><Smartphone className="mb-2 text-theater-gold" size={20}/> SMS sağlayıcı kimlik bilgileri yalnızca backende aittir.</div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/60"><Mail className="mb-2 text-theater-gold" size={20}/> Prodüksiyon yayını öncesi e-posta doğrulama şablonlarını kontrol et.</div></div>
        <AdminEndpointHint>Bağlı işlem: GET /api/settings ve PUT /api/settings.</AdminEndpointHint>
      </AdminSectionCard>
    </form>
  );
}
