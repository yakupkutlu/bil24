import { useMemo, useState } from 'react';
import { Activity, Bug, ClipboardCheck, KeyRound, PlugZap, ServerCrash, ShieldCheck } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricCard } from '@/components/admin/AdminMetricCard';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { EndpointCheckTable } from '@/components/integration/EndpointCheckTable';
import { IntegrationConfigCard } from '@/components/integration/IntegrationConfigCard';
import { Button } from '@/components/ui/Button';
import { endpointContracts, EndpointCheckResult, integrationService } from '@/services/integration.service';

const initialResults: EndpointCheckResult[] = endpointContracts.map((contract) => ({
  ...contract,
  status: 'SKIPPED',
  message: contract.canProbeSafely ? 'Henüz kontrol edilmedi.' : contract.note || 'Manuel yazma akışı testi gerekli.',
  checkedAt: ''
}));

export function AdminIntegrationPage() {
  const [results, setResults] = useState<EndpointCheckResult[]>(initialResults);
  const [running, setRunning] = useState(false);
  const config = integrationService.config();

  const metrics = useMemo(() => ({
    total: results.length,
    pass: results.filter((item) => item.status === 'PASS').length,
    fail: results.filter((item) => item.status === 'FAIL').length,
    manual: results.filter((item) => item.status === 'SKIPPED').length,
  }), [results]);

  async function runChecks() {
    setRunning(true);
    try {
      const next = await integrationService.probeSafeEndpoints();
      setResults(next);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="space-y-8">
      <AdminPageHeader
        eyebrow="Faz 7 backend doğrulaması"
        title="Frontend ve backendin aynı dili konuşmasını sağla."
        description="Backendi başlattıktan sonra bu sayfayı kullan. Güvenli endpointleri kontrol eder, bozuk sözleşmeleri vurgular ve otomatik kontrolleri gerçek ID isteyen yazma akışı testlerinden ayırır."
        actions={<><Button variant="outline" onClick={() => navigator.clipboard?.writeText(config.baseUrl)}>Copy API URL</Button><Button onClick={runChecks} disabled={running}><PlugZap size={18}/> {running ? 'Kontrol ediliyor...' : 'Kontrolleri çalıştır'}</Button></>}
      />

      <IntegrationConfigCard />

      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard title="Sözleşme endpointleri" value={metrics.total} icon={<ClipboardCheck size={20}/>} hint="Frontend bunları bekler" />
        <AdminMetricCard title="Başarılı" value={metrics.pass} icon={<ShieldCheck size={20}/>} hint="Doğru yanıt verdi" />
        <AdminMetricCard title="Başarısız" value={metrics.fail} icon={<ServerCrash size={20}/>} hint="Backend/frontend düzeltmesi gerekli" />
        <AdminMetricCard title="Manuel testler" value={metrics.manual} icon={<KeyRound size={20}/>} hint="Giriş, ID veya yazma işlemi gerekli" />
      </div>

      <EndpointCheckTable results={results} onRun={runChecks} running={running} />

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminSectionCard title="1. Önce kimlik" description="Admin veya gişe akışlarını test etmeden önce giriş, refresh token, rol yönlendirme ve korumalı rotalar geçmeli.">
          <div className="space-y-3 text-sm text-white/60">
            <p>Use seed accounts from the backend and confirm the response includes <code className="text-theater-gold">user</code> and <code className="text-theater-gold">accessToken</code>.</p>
            <p>Token yenileme backend tarafından HttpOnly cookie olarak saklanmalıdır.</p>
          </div>
        </AdminSectionCard>
        <AdminSectionCard title="2. Sonra satın alma akışı" description="Rezervasyon ve ödeme testinden önce gerçek seans ID’si ve müsait koltuk kodları kullan.">
          <div className="space-y-3 text-sm text-white/60">
            <p>Check <code className="text-theater-gold">GET /showtimes/:id/seats</code>, ardından koltukları kilitle, rezervasyon oluştur, ödeme yap ve biletleri getir.</p>
            <p>Sadece backend modu tüm frontend/backend uyumsuzluklarını hızlıca ortaya çıkarır.</p>
          </div>
        </AdminSectionCard>
        <AdminSectionCard title="3. En son personel/admin" description="Müşteri satın alma akışı çalıştıktan sonra QR girişi ve tüm admin CRUD ekranlarını test et.">
          <div className="space-y-3 text-sm text-white/60">
            <p>QR tests need real <code className="text-theater-gold">qrToken</code> values from generated tickets.</p>
            <p>Admin CRUD needs role <code className="text-theater-gold">ADMIN</code> or <code className="text-theater-gold">SUPER_ADMIN</code>.</p>
          </div>
        </AdminSectionCard>
      </div>

      <AdminSectionCard title="Faz 7 düzeltme kaydı" description="Bu frontend sürümünün entegrasyon testi için zaten iyileştirdikleri.">
        <div className="grid gap-3 md:grid-cols-2">
          <p className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/60"><Activity className="mb-2 text-theater-gold" size={18}/> Eklendi a live integration dashboard at <code>/admin/integration</code>.</p>
          <p className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/60"><Bug className="mb-2 text-theater-gold" size={18}/> API hata normalizasyonu HTTP durumu, endpoint, method ve backend detaylarıyla iyileştirildi.</p>
          <p className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/60"><PlugZap className="mb-2 text-theater-gold" size={18}/> Genel, müşteri, admin, rapor, ödeme, iade ve işlem kayıtları rotaları için güvenli endpoint kontrolü eklendi.</p>
          <p className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/60"><ShieldCheck className="mb-2 text-theater-gold" size={18}/> Kept strict backend mode controlled by <code>VITE_ENABLE_DEMO_FALLBACK=false</code>.</p>
        </div>
      </AdminSectionCard>
    </main>
  );
}
