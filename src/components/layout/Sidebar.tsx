import { NavLink } from 'react-router-dom';
import {
  Home, Calendar, Clock, Ticket, ShoppingCart, ScanLine, LayoutGrid,
  Building2, Users, DollarSign, Palette, Bell, BarChart3,
  Sun, Moon, LogOut, X, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems: NavItem[] = [
    { label: 'Ana Sayfa', icon: <Home className="w-5 h-5" />, path: '/', roles: ['customer', 'operator', 'super_admin'] },
    { label: 'Etkinlikler', icon: <Calendar className="w-5 h-5" />, path: '/events', roles: ['customer', 'operator', 'super_admin'] },
    { label: 'Program', icon: <Clock className="w-5 h-5" />, path: '/sessions', roles: ['customer', 'operator', 'super_admin'] },
    { label: 'Biletlerim', icon: <Ticket className="w-5 h-5" />, path: '/my-tickets', roles: ['customer'] },
    { label: 'Bilet Satış', icon: <ShoppingCart className="w-5 h-5" />, path: '/ticket-sales', roles: ['operator', 'super_admin'] },
    { label: 'Satılan Biletler', icon: <Ticket className="w-5 h-5" />, path: '/sold-tickets', roles: ['operator', 'super_admin'] },
    { label: 'Karekod Kontrol', icon: <ScanLine className="w-5 h-5" />, path: '/qr-check', roles: ['operator', 'super_admin'] },
    { label: 'Salon Durumu', icon: <LayoutGrid className="w-5 h-5" />, path: '/hall-status', roles: ['operator', 'super_admin'] },
    { label: 'Salon Yönetimi', icon: <Building2 className="w-5 h-5" />, path: '/halls', roles: ['super_admin'] },
    { label: 'Kullanıcı Yönetimi', icon: <Users className="w-5 h-5" />, path: '/users', roles: ['super_admin'] },
    { label: 'Fiyatlandırma', icon: <DollarSign className="w-5 h-5" />, path: '/pricing', roles: ['super_admin'] },
    { label: 'Bilet Tasarımı', icon: <Palette className="w-5 h-5" />, path: '/ticket-design', roles: ['super_admin'] },
    { label: 'SMS API Ayarları', icon: <MessageSquare className="w-5 h-5" />, path: '/sms-settings', roles: ['super_admin'] },
    { label: 'Bildirim Ayarları', icon: <Bell className="w-5 h-5" />, path: '/notifications', roles: ['super_admin'] },
    { label: 'Raporlar', icon: <BarChart3 className="w-5 h-5" />, path: '/reports', roles: ['super_admin'] },
  ];

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user?.role || 'customer')
  );

  const roleLabels: Record<string, string> = {
    customer: 'Müşteri',
    operator: 'Görevli',
    super_admin: 'Süper Admin',
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed lg:static top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 z-40 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <button onClick={onClose} className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Ticket className="w-7 h-7 text-primary-600" />
            <span className="font-bold text-xl text-gray-900 dark:text-white">eBilet24</span>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    isActive ? 'sidebar-item-active' : 'sidebar-item'
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <><Sun className="w-5 h-5" /><span>Açık Tema</span></> : <><Moon className="w-5 h-5" /><span>Koyu Tema</span></>}
          </button>

          {user && (
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[user.role] || user.role}</p>
            </div>
          )}

          <button
            onClick={() => { signOut(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>
    </>
  );
}
