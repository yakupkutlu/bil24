# Environment Configuration

Copy `.env.example` to `.env`.

## Required

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tiatru
JWT_ACCESS_SECRET=change_me_access_secret_at_least_32_chars
JWT_REFRESH_SECRET=change_me_refresh_secret_at_least_32_chars
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Optional Production Services

```env
REDIS_URL=
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
SMS_API_KEY=
```

The app uses MongoDB TTL seat locks by default. Redis is optional for future real-time scaling.
