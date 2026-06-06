import { api, API_BASE_URL, STRICT_BACKEND_MODE, normalizeApiError } from './api';
import { authService } from './auth.service';

export type EndpointRisk = 'LOW' | 'MEDIUM' | 'HIGH';
export type EndpointArea = 'Genel' | 'Kimlik' | 'Müşteri' | 'Gişe' | 'Admin' | 'Ödemeler' | 'Biletler';
export type EndpointCheckStatus = 'PASS' | 'FAIL' | 'SKIPPED';

export type EndpointContract = {
  id: string;
  area: EndpointArea;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  risk: EndpointRisk;
  requiresAuth?: boolean;
  canProbeSafely?: boolean;
  probePath?: string;
  note?: string;
};

export type EndpointCheckResult = EndpointContract & {
  status: EndpointCheckStatus;
  statusCode?: number;
  message: string;
  checkedAt: string;
};

export const endpointContracts: EndpointContract[] = [
  { id: 'health', area: 'Genel', method: 'GET', path: '/health or /settings', probePath: '/health', title: 'Backend sağlık/ayar kontrolü', risk: 'LOW', canProbeSafely: true, note: '/health yoksa /settings endpointine geçer.' },
  { id: 'events-list', area: 'Genel', method: 'GET', path: '/events', title: 'Genel etkinlik listesi', risk: 'HIGH', canProbeSafely: true },
  { id: 'showtimes-list', area: 'Genel', method: 'GET', path: '/showtimes', title: 'Seans listesi', risk: 'HIGH', canProbeSafely: true },
  { id: 'settings-get', area: 'Genel', method: 'GET', path: '/settings', title: 'Sistem ayarları', risk: 'MEDIUM', canProbeSafely: true },
  { id: 'auth-login', area: 'Kimlik', method: 'POST', path: '/auth/login', title: 'Giriş', risk: 'HIGH', note: 'Başarısız giriş karmaşasını önlemek için seed hesaplarla manuel test edin.' },
  { id: 'auth-refresh', area: 'Kimlik', method: 'POST', path: '/auth/refresh', title: 'Token yenileme', risk: 'HIGH', note: 'Gerçek girişten gelen HttpOnly cookie gerektirir.' },
  { id: 'profile-get', area: 'Müşteri', method: 'GET', path: '/profile', title: 'Profil', risk: 'HIGH', requiresAuth: true, canProbeSafely: true },
  { id: 'bookings-my', area: 'Müşteri', method: 'GET', path: '/bookings/my', title: 'Rezervasyonlarım', risk: 'HIGH', requiresAuth: true, canProbeSafely: true },
  { id: 'tickets-my', area: 'Biletler', method: 'GET', path: '/tickets/my', title: 'Biletlerim', risk: 'HIGH', requiresAuth: true, canProbeSafely: true },
  { id: 'seats-get', area: 'Genel', method: 'GET', path: '/showtimes/:id/seats', title: 'Koltuk müsaitliği', risk: 'HIGH', note: 'Backendden gerçek seans değeri gerekir.' },
  { id: 'hold-seats', area: 'Genel', method: 'POST', path: '/showtimes/:id/hold-seats', title: 'Koltuk kilitle', risk: 'HIGH', note: 'Gerçek seans değeri ve gerçek koltuk kodları gerekir.' },
  { id: 'booking-create', area: 'Müşteri', method: 'POST', path: '/bookings', title: 'Rezervasyon oluştur', risk: 'HIGH', note: 'Koltuk müsaitliği başarılı olduktan sonra test edilmelidir.' },
  { id: 'payment-checkout', area: 'Ödemeler', method: 'POST', path: '/payments/checkout', title: 'Ödeme tamamlama', risk: 'HIGH', note: 'Geçerli rezervasyon değeri gerekir.' },
  { id: 'tickets-verify', area: 'Gişe', method: 'POST', path: '/tickets/verify', title: 'QR bileti doğrula', risk: 'HIGH', note: 'Gerçek qrToken gerekir.' },
  { id: 'ticket-mark-used', area: 'Gişe', method: 'POST', path: '/tickets/:id/mark-used', title: 'Bileti kullanıldı işaretle', risk: 'HIGH', note: 'Gerçek bilet değeri gerekir.' },
  { id: 'admin-dashboard', area: 'Admin', method: 'GET', path: '/reports/dashboard', title: 'Admin panel raporu', risk: 'HIGH', requiresAuth: true, canProbeSafely: true },
  { id: 'admin-users', area: 'Admin', method: 'GET', path: '/users', title: 'Admin kullanıcı listesi', risk: 'HIGH', requiresAuth: true, canProbeSafely: true },
  { id: 'admin-payments', area: 'Admin', method: 'GET', path: '/payments', title: 'Admin ödeme listesi', risk: 'MEDIUM', requiresAuth: true, canProbeSafely: true },
  { id: 'admin-refunds', area: 'Admin', method: 'GET', path: '/refunds', title: 'Admin iade listesi', risk: 'MEDIUM', requiresAuth: true, canProbeSafely: true },
  { id: 'admin-audit', area: 'Admin', method: 'GET', path: '/audit-logs', title: 'İşlem kayıtları', risk: 'MEDIUM', requiresAuth: true, canProbeSafely: true }
];

async function safeGet(path: string) {
  if (path === '/health') {
    try {
      return await api.get('/health');
    } catch {
      return api.get('/settings');
    }
  }
  return api.get(path);
}

export const integrationService = {
  config: () => ({ baseUrl: API_BASE_URL, backendOnlyMode: STRICT_BACKEND_MODE, strictBackendMode: STRICT_BACKEND_MODE }),
  login: authService.login,
  endpointContracts,
  async probeEndpoint(contract: EndpointContract): Promise<EndpointCheckResult> {
    const checkedAt = new Date().toISOString();
    if (!contract.canProbeSafely || contract.method !== 'GET') {
      return { ...contract, status: 'SKIPPED', message: contract.note || 'Gerçek ID gerektiği veya veri yazdığı için otomatik kontrol edilmedi.', checkedAt };
    }

    try {
      const response = await safeGet(contract.probePath || contract.path);
      return { ...contract, status: 'PASS', statusCode: response.status, message: 'Endpoint başarıyla yanıt verdi.', checkedAt };
    } catch (error) {
      const normalized = normalizeApiError(error);
      return { ...contract, status: 'FAIL', statusCode: normalized.status, message: normalized.message, checkedAt };
    }
  },
  async probeSafeEndpoints(): Promise<EndpointCheckResult[]> {
    return Promise.all(endpointContracts.map((contract) => integrationService.probeEndpoint(contract)));
  }
};
