# Frontend Structure

```txt
frontend/
├── public/
│   └── tiatru-logo.svg
├── src/
│   ├── app/
│   │   ├── providers.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── checkout/
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── layout/
│   │   ├── seats/
│   │   ├── tickets/
│   │   └── ui/
│   ├── constants/
│   ├── hooks/
│   ├── pages/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── box-office/
│   │   ├── customer/
│   │   └── public/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   ├── types/
│   └── utils/
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Architecture

- `router.tsx` defines every public, customer, box-office, and admin route.
- `ProtectedRoute` checks login and role permission.
- `PublicLayout`, `CustomerLayout`, `BoxOfficeLayout`, and `AdminLayout` separate UI shells.
- Services are grouped by backend domain and share the configured Axios instance.
- Local preview data powers UI previews until the backend is running.
