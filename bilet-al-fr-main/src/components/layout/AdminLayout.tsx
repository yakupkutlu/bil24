// ============================================================
// AdminLayout - Sidebar + Header
// ============================================================

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useAppStore } from '../../utils/api';
import {
  LayoutDashboard, CalendarDays, MapPin, Ticket, CreditCard, Users,
  BarChart3, Settings, QrCode, Map, LogOut, Menu, X, Sun, Moon,
  Globe, ChevronDown, Bell, User, Theater, Calendar, Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

interface NavItem {
  icon: any;
  labelKey: string;
  path: string;
  roles: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/panel', roles: ['operator', 'super_admin'] },
  { icon: Theater, labelKey: 'nav.events', path: '/panel/etkinlikler', roles: ['super_admin'] },
  { icon: CalendarDays, labelKey: 'nav.sessions', path: '/panel/seanslar', roles: ['operator', 'super_admin'] },
  { icon: Calendar, labelKey: 'nav.calendar', path: '/panel/takvim', roles: ['operator', 'super_admin'] },
  { icon: MapPin, labelKey: 'nav.venues', path: '/panel/salonlar', roles: ['super_admin'] },
  { icon: Ticket, labelKey: 'nav.tickets', path: '/panel/biletler', roles: ['operator', 'super_admin'] },
  { icon: QrCode, labelKey: 'nav.scanTicket', path: '/panel/bilet-tara', roles: ['operator', 'super_admin'] },
  { icon: CreditCard, labelKey: 'nav.payments', path: '/panel/odemeler', roles: ['operator', 'super_admin'] },
  { icon: Users, labelKey: 'nav.users', path: '/panel/kullanicilar', roles: ['super_admin'] },
  { icon: BarChart3, labelKey: 'nav.reports', path: '/panel/raporlar', roles: ['operator', 'super_admin'] },
  { icon: Settings, labelKey: 'nav.settings', path: '/panel/ayarlar', roles: ['super_admin'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar, setLanguage, language } = useAppStore();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    logout();
    navigate('/giris');
    toast.success('Çıkış yapıldı');
  };

  const handleLanguageToggle = () => {
    const newLang = language === 'tr' ? 'en' : 'tr';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const filteredNav = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const isActive = (path: string) =>
    path === '/panel' ? location.pathname === '/panel' : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0
        bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        flex flex-col transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0 z-30 lg:relative
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-slate-900 dark:text-white text-lg">
                BiletSis
              </span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    title={!sidebarOpen ? t(item.labelKey) : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                      transition-all duration-150 group relative
                      ${active
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                    {sidebarOpen && (
                      <span className="truncate">{t(item.labelKey)}</span>
                    )}
                    {active && sidebarOpen && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        {sidebarOpen && user && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate">{t(`users.role.${user.role}`)}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 gap-4 flex-shrink-0">
          {/* Mobile menu */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Header actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Home link */}
            <Link
              to="/"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Home className="w-4 h-4" />
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
                  {user?.firstName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-modal border border-slate-200 dark:border-slate-700 z-50 py-1">
                  <Link
                    to="/biletlerim"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Ticket className="w-4 h-4" />
                    {t('nav.myTickets')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
