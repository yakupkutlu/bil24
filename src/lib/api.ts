const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function getToken(): string | null {
  return localStorage.getItem('biletal_token');
}

export function setToken(token: string): void {
  localStorage.setItem('biletal_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('biletal_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>('GET', path, undefined, params),

  post: <T>(path: string, body?: unknown) =>
    request<T>('POST', path, body),

  put: <T>(path: string, body?: unknown) =>
    request<T>('PUT', path, body),

  delete: <T>(path: string, params?: Record<string, string>) =>
    request<T>('DELETE', path, undefined, params),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: import('../types').Profile }>('/api/auth/login', { email, password }),

  register: (email: string, password: string, full_name: string, phone: string, role: string) =>
    api.post<{ token: string; user: import('../types').Profile }>('/api/auth/register', { email, password, full_name, phone, role }),

  me: () => api.get<import('../types').Profile>('/api/auth/me'),

  updateProfile: (data: { full_name?: string; phone?: string; current_password?: string; new_password?: string }) =>
    api.put<import('../types').Profile>('/api/auth/profile', data),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () => api.get<import('../types').Profile[]>('/api/users'),
  update: (id: string, data: Partial<import('../types').Profile>) =>
    api.put<import('../types').Profile>(`/api/users/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/users/${id}`),
};

// ─── Halls ────────────────────────────────────────────────────────────────────

export const hallsApi = {
  list: () => api.get<import('../types').Hall[]>('/api/halls'),
  get: (id: string) => api.get<import('../types').Hall>(`/api/halls/${id}`),
  create: (data: Partial<import('../types').Hall>) =>
    api.post<import('../types').Hall>('/api/halls', data),
  update: (id: string, data: Partial<import('../types').Hall>) =>
    api.put<import('../types').Hall>(`/api/halls/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/halls/${id}`),
};

// ─── Seats ────────────────────────────────────────────────────────────────────

export const seatsApi = {
  list: (hall_id?: string) =>
    api.get<import('../types').Seat[]>('/api/seats', hall_id ? { hall_id } : undefined),
  bulkCreate: (seats: Partial<import('../types').Seat>[]) =>
    api.post<import('../types').Seat[]>('/api/seats/bulk', { seats }),
  update: (id: string, data: Partial<import('../types').Seat>) =>
    api.put<import('../types').Seat>(`/api/seats/${id}`, data),
  deleteByHall: (hall_id: string) =>
    api.delete<{ success: boolean }>('/api/seats', { hall_id }),
  listWithOccupied: async (hall_id: string, session_id?: string) => {
    const seats = await api.get<import('../types').Seat[]>('/api/seats', { hall_id });
    if (!session_id) return seats;
    const tickets = await api.get<{ seat_id: string }[]>('/api/tickets', { session_id });
    const occupied = new Set(tickets.map(t => t.seat_id).filter(Boolean));
    return seats.map(s => ({ ...s, isOccupied: occupied.has(s.id) }));
  },
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (is_active?: boolean) =>
    api.get<import('../types').Event[]>('/api/events', is_active !== undefined ? { is_active: String(is_active) } : undefined),
  get: (id: string) => api.get<import('../types').Event>(`/api/events/${id}`),
  create: (data: Partial<import('../types').Event>) =>
    api.post<import('../types').Event>('/api/events', data),
  update: (id: string, data: Partial<import('../types').Event>) =>
    api.put<import('../types').Event>(`/api/events/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/events/${id}`),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  list: (params?: { event_id?: string; hall_id?: string; session_date?: string; status?: string }) =>
    api.get<import('../types').Session[]>('/api/sessions', params as Record<string, string>),
  get: (id: string) => api.get<import('../types').Session>(`/api/sessions/${id}`),
  create: (data: Partial<import('../types').Session>) =>
    api.post<import('../types').Session>('/api/sessions', data),
  update: (id: string, data: Partial<import('../types').Session>) =>
    api.put<import('../types').Session>(`/api/sessions/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/sessions/${id}`),
};

// ─── Tickets ──────────────────────────────────────────────────────────────────

export const ticketsApi = {
  list: (params?: { session_id?: string; sold_by?: string; start_date?: string; end_date?: string }) =>
    api.get<import('../types').Ticket[]>('/api/tickets', params as Record<string, string>),
  byQR: (qrCode: string) => api.get<import('../types').Ticket>(`/api/tickets/by-qr/${encodeURIComponent(qrCode)}`),
  byCode: (ticketCode: string) => api.get<import('../types').Ticket>(`/api/tickets/by-code/${ticketCode}`),
  bulkCreate: (tickets: Partial<import('../types').Ticket>[]) =>
    api.post<import('../types').Ticket[]>('/api/tickets/bulk', { tickets }),
  update: (id: string, data: Partial<import('../types').Ticket>) =>
    api.put<import('../types').Ticket>(`/api/tickets/${id}`, data),
};

// ─── Pricing ──────────────────────────────────────────────────────────────────

export const pricingApi = {
  getSettings: () => api.get<import('../types').PricingSettings>('/api/pricing-settings'),
  saveSettings: (data: { kdv_rate: number; commission_rate: number }) =>
    api.post<import('../types').PricingSettings>('/api/pricing-settings', data),
  getCategories: (session_id?: string) =>
    api.get<import('../types').PricingCategory[]>('/api/pricing-categories', session_id ? { session_id } : undefined),
  createCategory: (data: Partial<import('../types').PricingCategory>) =>
    api.post<import('../types').PricingCategory>('/api/pricing-categories', data),
  updateCategory: (id: string, data: Partial<import('../types').PricingCategory>) =>
    api.put<import('../types').PricingCategory>(`/api/pricing-categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<{ success: boolean }>(`/api/pricing-categories/${id}`),
};

// ─── QR Scan Logs ─────────────────────────────────────────────────────────────

export const qrApi = {
  list: (limit?: number) =>
    api.get<import('../types').QRScanLog[]>('/api/qr-scan-logs', limit ? { limit: String(limit) } : undefined),
  log: (ticket_id: string, scan_result: string, is_duplicate: boolean) =>
    api.post<import('../types').QRScanLog>('/api/qr-scan-logs', { ticket_id, scan_result, is_duplicate }),
};

// ─── Notification & Design ────────────────────────────────────────────────────

export const notificationApi = {
  get: () => api.get<import('../types').NotificationSettings>('/api/notification-settings'),
  update: (data: Partial<import('../types').NotificationSettings>) =>
    api.put<import('../types').NotificationSettings>('/api/notification-settings', data),
};

// ─── SMS ──────────────────────────────────────────────────────────────────────

export interface SmsSettings {
  id?: number;
  active_provider: 'iletimerkezi' | 'twilio';
  // İleti Merkezi
  im_sender?: string;
  im_api_key?: string;
  im_hash_key?: string;   // write-only (not returned by GET)
  // Twilio
  twilio_account_sid?: string;
  twilio_auth_token?: string;  // write-only
  twilio_from?: string;
  created_at?: string;
}

export const smsApi = {
  getSettings: () => api.get<SmsSettings>('/api/sms-settings'),
  saveSettings: (data: SmsSettings) => api.put<SmsSettings>('/api/sms-settings', data),
  send: (ticket_id: string) =>
    api.post<{ success: boolean; message?: string; error?: string; orderId?: string }>(
      '/api/sms/send', { ticket_id }
    ),
};

// ─── Public Ticket (auth yok) ─────────────────────────────────────────────────

const API_BASE_RAW = (import.meta.env.VITE_API_URL || 'http://localhost:3001') as string;

export async function fetchPublicTicket(ticketCode: string) {
  const res = await fetch(`${API_BASE_RAW}/api/public/tickets/${ticketCode.toUpperCase()}`);
  if (!res.ok) throw new Error('Bilet bulunamadı');
  return res.json();
}

export const ticketDesignApi = {
  get: () => api.get<import('../types').TicketDesign>('/api/ticket-design'),
  update: (data: Partial<import('../types').TicketDesign>) =>
    api.put<import('../types').TicketDesign>('/api/ticket-design', data),
};

// ─── Activity Logs ────────────────────────────────────────────────────────────

export const activityApi = {
  list: () => api.get<import('../types').ActivityLog[]>('/api/activity-logs'),
  log: (action: string, entity_type: string, entity_id?: string, details?: Record<string, unknown>) =>
    api.post<import('../types').ActivityLog>('/api/activity-logs', { action, entity_type, entity_id, details }),
};
