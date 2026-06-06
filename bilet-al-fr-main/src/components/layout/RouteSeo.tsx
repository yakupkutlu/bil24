import { useLocation } from 'react-router-dom';
import { Seo } from './Seo';

const titles: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Tiatru | Modern Tiyatro Biletleri',
    description: 'Tiyatro oyunlarını keşfet, koltuğunu görsel olarak seç, güvenli ödeme yap ve QR biletini al.'
  },
  '/events': {
    title: 'Oyunlar | Tiatru',
    description: 'Tiatru sahnesindeki güncel oyunları, seansları ve bilet seçeneklerini keşfet.'
  },
  '/checkout': {
    title: 'Güvenli Ödeme | Tiatru',
    description: 'Seçtiğin koltuklar için güvenli ödeme adımını tamamla.'
  },
  '/customer/dashboard': {
    title: 'Müşteri Paneli | Tiatru',
    description: 'Biletlerini, rezervasyonlarını, siparişlerini ve iade taleplerini yönet.'
  },
  '/box-office/dashboard': {
    title: 'Gişe Paneli | Tiatru',
    description: 'Gişe satışları, QR doğrulama, rezervasyonlar ve günlük seans operasyonları.'
  },
  '/admin/dashboard': {
    title: 'Admin Paneli | Tiatru',
    description: 'Tiatru yönetim paneli: etkinlikler, seanslar, salonlar, ödemeler, iadeler ve raporlar.'
  }
};

function resolveSeo(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith('/events/')) return { title: 'Oyun Detayı | Tiatru', description: 'Oyun bilgileri, oyuncular, seanslar ve bilet seçenekleri.' };
  if (pathname.includes('/seats')) return { title: 'Koltuk Seçimi | Tiatru', description: 'Sahne düzenini görerek koltuğunu seç ve rezervasyonunu tamamla.' };
  if (pathname.startsWith('/admin/')) return { title: 'Yönetim Paneli | Tiatru', description: 'Tiatru üretim yönetim ekranı.' };
  if (pathname.startsWith('/customer/')) return { title: 'Hesabım | Tiatru', description: 'Tiatru müşteri hesabı ve bilet deneyimi.' };
  if (pathname.startsWith('/box-office/')) return { title: 'Gişe Operasyonu | Tiatru', description: 'Tiatru gişe ve giriş kontrol deneyimi.' };
  return { title: 'Tiatru | Modern Tiyatro Biletleri', description: 'Modern tiyatro bilet satış ve QR giriş platformu.' };
}

export function RouteSeo() {
  const { pathname } = useLocation();
  const seo = resolveSeo(pathname);
  return <Seo title={seo.title} description={seo.description} canonicalPath={pathname} />;
}
