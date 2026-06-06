// ============================================================
// APP.tsx - Main App with Routing
// ============================================================

import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { tr, en } from './i18n/translations';
import { useAuthStore, useAppStore } from './utils/api';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const EventsPage = lazy(() => import('./pages/admin/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/admin/EventDetailPage'));
const VenuesPage = lazy(() => import('./pages/admin/VenuesPage'));
const SessionsPage = lazy(() => import('./pages/admin/SessionsPage'));
const TicketsPage = lazy(() => import('./pages/admin/TicketsPage'));
const TicketScanPage = lazy(() => import('./pages/operator/TicketScanPage'));
const SeatMapPage = lazy(() => import('./pages/operator/SeatMapPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const PublicHomePage = lazy(() => import('./pages/public/HomePage'));
const PublicEventPage = lazy(() => import('./pages/public/EventPage'));
const CalendarPage = lazy(() => import('./pages/admin/CalendarPage'));
const MyTicketsPage = lazy(() => import('./pages/customer/MyTicketsPage'));
const PaymentsPage = lazy(() => import('./pages/admin/PaymentsPage'));

// Init i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { tr, en },
    fallbackLng: 'tr',
    interpolation: { escapeValue: false },
  });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

// Auth guard
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/giris" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Yükleniyor...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<PublicHomePage />} />
            <Route path="/etkinlik/:slug" element={<PublicEventPage />} />
            <Route path="/giris" element={<LoginPage />} />
            <Route path="/kayit" element={<RegisterPage />} />

            {/* Customer */}
            <Route path="/biletlerim" element={
              <ProtectedRoute roles={['customer', 'operator', 'super_admin']}>
                <AdminLayout>
                  <MyTicketsPage />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Admin / Operator */}
            <Route path="/panel" element={
              <ProtectedRoute roles={['operator', 'super_admin']}>
                <AdminLayout><DashboardPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/etkinlikler" element={
              <ProtectedRoute roles={['super_admin']}>
                <AdminLayout><EventsPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/etkinlikler/:id" element={
              <ProtectedRoute roles={['super_admin']}>
                <AdminLayout><EventDetailPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/salonlar" element={
              <ProtectedRoute roles={['super_admin']}>
                <AdminLayout><VenuesPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/seanslar" element={
              <ProtectedRoute roles={['operator', 'super_admin']}>
                <AdminLayout><SessionsPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/takvim" element={
              <ProtectedRoute roles={['operator', 'super_admin']}>
                <AdminLayout><CalendarPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/biletler" element={
              <ProtectedRoute roles={['operator', 'super_admin']}>
                <AdminLayout><TicketsPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/odemeler" element={
              <ProtectedRoute roles={['operator', 'super_admin']}>
                <AdminLayout><PaymentsPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/bilet-tara" element={
              <ProtectedRoute roles={['operator', 'super_admin']}>
                <AdminLayout><TicketScanPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/koltuk-plani/:sessionId" element={
              <ProtectedRoute roles={['operator', 'super_admin']}>
                <AdminLayout><SeatMapPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/kullanicilar" element={
              <ProtectedRoute roles={['super_admin']}>
                <AdminLayout><UsersPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/raporlar" element={
              <ProtectedRoute roles={['operator', 'super_admin']}>
                <AdminLayout><ReportsPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/panel/ayarlar" element={
              <ProtectedRoute roles={['super_admin']}>
                <AdminLayout><SettingsPage /></AdminLayout>
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
