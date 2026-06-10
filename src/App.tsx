import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import HomePage from './pages/HomePage';
import EventList from './components/events/EventList';
import EventDetail from './components/events/EventDetail';
import EventForm from './components/events/EventForm';
import HallList from './components/halls/HallList';
import HallForm from './components/halls/HallForm';
import SessionList from './components/sessions/SessionList';
import SessionForm from './components/sessions/SessionForm';
import TicketSales from './components/tickets/TicketSales';
import QRCheck from './components/operator/QRCheck';
import HallStatus from './components/operator/HallStatus';
import PricingSettings from './components/pricing/PricingSettings';
import UserManagement from './components/admin/UserManagement';
import Reports from './components/admin/Reports';
import TicketDesignPage from './components/admin/TicketDesignPage';
import NotificationSettings from './components/notifications/NotificationSettings';
import MyTickets from './pages/MyTickets';
import SoldTickets from './pages/SoldTickets';
import DigitalTicket from './pages/DigitalTicket';
import SmsSettingsPage from './pages/SmsSettings';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/bilet/:ticketCode" element={<DigitalTicket />} />

      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="events" element={<EventList />} />
        <Route path="events/new" element={<ProtectedRoute roles={['super_admin']}><EventForm /></ProtectedRoute>} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/:id/edit" element={<ProtectedRoute roles={['super_admin']}><EventForm /></ProtectedRoute>} />
        <Route path="sessions" element={<SessionList />} />
        <Route path="sessions/new" element={<ProtectedRoute roles={['super_admin']}><SessionForm /></ProtectedRoute>} />
        <Route path="sessions/:id/edit" element={<ProtectedRoute roles={['super_admin']}><SessionForm /></ProtectedRoute>} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="sold-tickets" element={<ProtectedRoute roles={['operator', 'super_admin']}><SoldTickets /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="ticket-sales" element={<ProtectedRoute><TicketSales /></ProtectedRoute>} />
        <Route path="qr-check" element={<ProtectedRoute roles={['operator', 'super_admin']}><QRCheck /></ProtectedRoute>} />
        <Route path="hall-status" element={<ProtectedRoute roles={['operator', 'super_admin']}><HallStatus /></ProtectedRoute>} />
        <Route path="halls" element={<ProtectedRoute roles={['super_admin']}><HallList /></ProtectedRoute>} />
        <Route path="halls/new" element={<ProtectedRoute roles={['super_admin']}><HallForm /></ProtectedRoute>} />
        <Route path="halls/:id/edit" element={<ProtectedRoute roles={['super_admin']}><HallForm /></ProtectedRoute>} />
        <Route path="pricing" element={<ProtectedRoute roles={['super_admin']}><PricingSettings /></ProtectedRoute>} />
        <Route path="ticket-design" element={<ProtectedRoute roles={['super_admin']}><TicketDesignPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['super_admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['super_admin']}><Reports /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute roles={['super_admin']}><NotificationSettings /></ProtectedRoute>} />
        <Route path="sms-settings" element={<ProtectedRoute roles={['super_admin']}><SmsSettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
