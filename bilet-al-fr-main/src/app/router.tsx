import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ADMIN_ROLES } from '@/constants/roles';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { BoxOfficeLayout } from '@/components/layout/BoxOfficeLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ForbiddenPage } from '@/components/layout/ForbiddenPage';
import { NotFoundPage } from '@/components/layout/NotFoundPage';
import { PageTransition } from '@/components/layout/PageTransition';
import { RouteSeo } from '@/components/layout/RouteSeo';
import { ServerErrorPage } from '@/components/layout/ServerErrorPage';

import { HomePage } from '@/pages/public/HomePage';
import { EventsPage } from '@/pages/public/EventsPage';
import { EventDetailsPage } from '@/pages/public/EventDetailsPage';
import { SeatSelectionPage } from '@/pages/public/SeatSelectionPage';
import { CheckoutPage } from '@/pages/public/CheckoutPage';
import { PaymentSuccessPage } from '@/pages/public/PaymentSuccessPage';
import { PaymentFailedPage } from '@/pages/public/PaymentFailedPage';
import { VerifyTicketPage } from '@/pages/public/VerifyTicketPage';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';

import { CustomerDashboardPage } from '@/pages/customer/CustomerDashboardPage';
import { CustomerTicketsPage } from '@/pages/customer/CustomerTicketsPage';
import { CustomerReservationsPage } from '@/pages/customer/CustomerReservationsPage';
import { CustomerProfilePage } from '@/pages/customer/CustomerProfilePage';
import { CustomerOrdersPage } from '@/pages/customer/CustomerOrdersPage';
import { CustomerRefundsPage } from '@/pages/customer/CustomerRefundsPage';

import { BoxOfficeDashboardPage } from '@/pages/box-office/BoxOfficeDashboardPage';
import { SellTicketPage } from '@/pages/box-office/SellTicketPage';
import { BoxOfficeVerifyPage } from '@/pages/box-office/BoxOfficeVerifyPage';
import { BoxOfficeReservationsPage } from '@/pages/box-office/BoxOfficeReservationsPage';
import { TodayShowsPage } from '@/pages/box-office/TodayShowsPage';

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminEventsPage } from '@/pages/admin/AdminEventsPage';
import { AdminEventFormPage } from '@/pages/admin/AdminEventFormPage';
import { AdminShowtimesPage } from '@/pages/admin/AdminShowtimesPage';
import { AdminShowtimeFormPage } from '@/pages/admin/AdminShowtimeFormPage';
import { AdminHallsPage } from '@/pages/admin/AdminHallsPage';
import { AdminHallCreatePage } from '@/pages/admin/AdminHallCreatePage';
import { AdminHallSeatsPage } from '@/pages/admin/AdminHallSeatsPage';
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage';
import { AdminBookingDetailsPage } from '@/pages/admin/AdminBookingDetailsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminUserDetailsPage } from '@/pages/admin/AdminUserDetailsPage';
import { AdminStaffPage } from '@/pages/admin/AdminStaffPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminRefundsPage } from '@/pages/admin/AdminRefundsPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminIntegrationPage } from '@/pages/admin/AdminIntegrationPage';
import { AdminProductionPage } from '@/pages/admin/AdminProductionPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <>
      <RouteSeo />
      <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        <Routes location={location}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventSlug" element={<EventDetailsPage />} />
          <Route path="/showtimes/:showtimeId/seats" element={<SeatSelectionPage />} />
          <Route path="/checkout" element={<ProtectedRoute roles={['CUSTOMER', 'BOX_OFFICE', 'ADMIN', 'SUPER_ADMIN']}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/callback" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          <Route path="/verify-ticket/:qrToken" element={<VerifyTicketPage />} />
          <Route path="/verify-ticket" element={<VerifyTicketPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/500" element={<ServerErrorPage />} />
        </Route>

        <Route path="/customer" element={<ProtectedRoute roles={['CUSTOMER']}><CustomerLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="dashboard" element={<CustomerDashboardPage />} />
          <Route path="tickets" element={<CustomerTicketsPage />} />
          <Route path="reservations" element={<CustomerReservationsPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="orders" element={<CustomerOrdersPage />} />
          <Route path="refunds" element={<CustomerRefundsPage />} />
        </Route>

        <Route path="/box-office" element={<ProtectedRoute roles={['BOX_OFFICE', 'ADMIN', 'SUPER_ADMIN']}><BoxOfficeLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/box-office/dashboard" replace />} />
          <Route path="dashboard" element={<BoxOfficeDashboardPage />} />
          <Route path="sell-ticket" element={<SellTicketPage />} />
          <Route path="verify" element={<BoxOfficeVerifyPage />} />
          <Route path="reservations" element={<BoxOfficeReservationsPage />} />
          <Route path="today" element={<TodayShowsPage />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="events/create" element={<AdminEventFormPage />} />
          <Route path="events/:id/edit" element={<AdminEventFormPage />} />
          <Route path="showtimes" element={<AdminShowtimesPage />} />
          <Route path="showtimes/create" element={<AdminShowtimeFormPage />} />
          <Route path="showtimes/:id/edit" element={<AdminShowtimeFormPage />} />
          <Route path="halls" element={<AdminHallsPage />} />
          <Route path="halls/create" element={<AdminHallCreatePage />} />
          <Route path="halls/:id/seats" element={<AdminHallSeatsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="bookings/:id" element={<AdminBookingDetailsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailsPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="refunds" element={<AdminRefundsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="integration" element={<AdminIntegrationPage />} />
          <Route path="production" element={<AdminProductionPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PageTransition>
      </AnimatePresence>
    </>
  );
}
