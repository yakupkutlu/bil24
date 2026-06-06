# Tiatru Frontend Deployment Guide

## 1. Required environment variables

Create production environment variables on your hosting provider:

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_APP_NAME=Tiatru
VITE_APP_ENV=production
VITE_ENABLE_DEMO_FALLBACK=false
```

Never use backend-only mode in production.

---

## 2. Build locally

```bash
npm install
npm run typecheck
npm run build
npm run preview
```

The production files are generated in:

```txt
dist/
```

---

## 3. Deploy to Vercel

Framework preset:

```txt
Vite
```

Build command:

```bash
npm run build
```

Output directory:

```txt
dist
```

Add rewrite for React Router:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

You can put this in `vercel.json` if needed.

---

## 4. Deploy to Netlify

Build command:

```bash
npm run build
```

Publish directory:

```txt
dist
```

Create `public/_redirects` or Netlify redirects:

```txt
/* /index.html 200
```

---

## 5. Deploy with Nginx

Example config:

```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /var/www/tiatru/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|webp|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
}
```

Use HTTPS with Certbot or your cloud provider.

---

## 6. Production checklist

Before launch:

```txt
Backend is deployed
CORS allows frontend domain
Cookies configured with secure/sameSite correctly
VITE_API_BASE_URL points to production API
VITE_ENABLE_DEMO_FALLBACK=false
Login/register works
Seat hold works
Checkout works
Payment callback works
Tickets generated
QR verification works
Admin CRUD works
Mobile tested
404/403/500 tested
```
