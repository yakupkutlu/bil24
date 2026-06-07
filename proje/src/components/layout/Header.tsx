import { useLocation } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const pageTitle: Record<string, string> = {
  '/': 'Ana Sayfa',
  '/events': 'Etkinlikler',
  '/sessions': 'Program',
  '/my-tickets': 'Biletlerim',
  '/ticket-sales': 'Bilet Satış',
  '/qr-check': 'Karekod Kontrol',
  '/hall-status': 'Salon Durumu',
  '/halls': 'Salon Yönetimi',
  '/users': 'Kullanıcı Yönetimi',
  '/pricing': 'Fiyatlandırma',
  '/ticket-design': 'Bilet Tasarımı',
  '/notifications': 'Bildirim Ayarları',
  '/reports': 'Raporlar',
};

const roleLabels: Record<string, string> = {
  customer: 'Müşteri',
  operator: 'Görevli',
  super_admin: 'Süper Admin',
};

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathKey = '/' + location.pathname.split('/').filter(Boolean).slice(0, 2).join('/') || '/';
  const title = pageTitle[location.pathname] || pageTitle[pathKey] || 'Sayfa';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button onClick={onMenuToggle} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        </div>

        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-semibold text-sm">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-sm text-left">
                <p className="font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[user.role]}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</span>
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                    {roleLabels[user.role]}
                  </span>
                </div>
                <button
                  onClick={() => { setIsDropdownOpen(false); signOut(); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
