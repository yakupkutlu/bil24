# Frontend Security Checklist

## Environment

- Do not commit `.env`.
- Keep only public Vite variables in frontend.
- Do not store payment secrets in frontend.
- Do not store email/SMS/provider secrets in frontend.

## Auth

- Access token should be short-lived.
- Refresh token should stay in HttpOnly cookie from backend.
- Frontend should clear session on 401 refresh failure.
- Role-protected routes should be treated as UX only; backend must enforce permissions.

## Payments

- Do not collect/store raw card data unless using provider-hosted fields.
- Prefer payment redirect/session from backend.
- Validate payment result on backend, not only on frontend callback.

## Tickets and QR

- Do not trust QR status from frontend.
- Backend must validate `qrToken` securely.
- Backend must prevent double entry atomically.
- Mark-used actions must require staff/admin role.

## Admin

- Every admin mutation must be authorized by backend.
- Audit logs should be created by backend.
- Destructive actions should require confirmation.

## Browser

- Use HTTPS only in production.
- Backend should configure secure cookies.
- Backend should restrict CORS to frontend domain.
- Avoid exposing stack traces in production responses.
