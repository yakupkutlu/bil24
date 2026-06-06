import { CheckCircle2, Gauge, Lock, Rocket, SearchCheck, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { AdminMetricCard } from '@/components/admin/AdminMetricCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { Badge } from '@/components/ui/Badge';

const checks = [
  { title: 'Sıkı backend modu', text: 'VITE_ENABLE_DEMO_FALLBACK=false ile gerçek API testi.', icon: <ShieldCheck size={18} />, status: 'Hazır' },
  { title: 'Hata sınırları', text: 'Beklenmeyen React hataları kullanıcı dostu 500 ekranına düşer.', icon: <Lock size={18} />, status: 'Eklendi' },
  { title: 'SEO meta sistemi', text: 'Rota bazlı başlık, açıklama, canonical ve sosyal meta etiketleri.', icon: <SearchCheck size={18} />, status: 'Eklendi' },
  { title: 'Manuel parçalama', text: 'Vite bundle parçalama React, grafikler, animasyon ve uygulama kodunu ayırır.', icon: <Zap size={18} />, status: 'Eklendi' },
  { title: 'Erişilebilirlik kontrolü', text: 'Atlama bağlantısı, odak halkası, aria-ready durumları ve azaltılmış hareket desteği.', icon: <Smartphone size={18} />, status: 'İyileştirildi' },
  { title: 'Dağıtım dokümanları', text: 'Vercel, Netlify, Nginx ve ortam adımları belgelendi.', icon: <Rocket size={18} />, status: 'Belgelendi' }
];

export function AdminProductionPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader eyebrow="Faz 10" title="Prodüksiyon Hazırlığı" description="Son frontend düzenlemeleri, dağıtıma hazırlık, SEO, erişilebilirlik, performans ve yayın kontrol listesi." />

      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard title="Derleme" value="Başarılı" icon={<CheckCircle2 />} />
        <AdminMetricCard title="Bundle stratejisi" value="Manuel parçalama" icon={<Gauge />} />
        <AdminMetricCard title="SEO" value="Route metaları" icon={<SearchCheck />} />
        <AdminMetricCard title="A11y" value="İyileştirildi" icon={<ShieldCheck />} />
      </div>

      <AdminSectionCard title="Yayın kontrol listesi" description="Bu sayfayı dağıtımdan önce ve Faz 7+ backend yeniden testinden önce kullan.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => (
            <article key={check.title} className="rounded-3xl border border-white/10 bg-white/[.035] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-theater-gold/10 text-theater-gold">{check.icon}</span>
                <Badge>{check.status}</Badge>
              </div>
              <h3 className="font-semibold text-white">{check.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{check.text}</p>
            </article>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}
