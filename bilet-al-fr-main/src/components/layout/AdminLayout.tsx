import { BarChart3, Building2, CalendarDays, ClipboardList, CreditCard, History, LayoutDashboard, PlugZap, Rocket, Settings, Theater, Ticket, Users, Wallet } from 'lucide-react';
import { SideLayout } from './SideLayout';

export function AdminLayout() {
  return (
    <SideLayout
      title="Yönetim Paneli"
      nav={[
        { to: '/admin/dashboard', label: 'Panel', icon: <LayoutDashboard size={18} /> },
        { to: '/admin/events', label: 'Etkinlikler', icon: <Theater size={18} /> },
        { to: '/admin/showtimes', label: 'Seanslar', icon: <CalendarDays size={18} /> },
        { to: '/admin/halls', label: 'Salonlar', icon: <Building2 size={18} /> },
        { to: '/admin/bookings', label: 'Rezervasyonlar', icon: <ClipboardList size={18} /> },
        { to: '/admin/users', label: 'Kullanıcılar', icon: <Users size={18} /> },
        { to: '/admin/staff', label: 'Personel', icon: <Ticket size={18} /> },
        { to: '/admin/payments', label: 'Ödemeler', icon: <CreditCard size={18} /> },
        { to: '/admin/refunds', label: 'İadeler', icon: <Wallet size={18} /> },
        { to: '/admin/reports', label: 'Raporlar', icon: <BarChart3 size={18} /> },
        { to: '/admin/settings', label: 'Ayarlar', icon: <Settings size={18} /> },
        { to: '/admin/audit-logs', label: 'İşlem Kayıtları', icon: <History size={18} /> },
        { to: '/admin/integration', label: 'Entegrasyon', icon: <PlugZap size={18} /> },
        { to: '/admin/production', label: 'Prodüksiyon', icon: <Rocket size={18} /> }
      ]}
    />
  );
}
