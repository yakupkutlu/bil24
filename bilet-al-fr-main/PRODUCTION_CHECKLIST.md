# Final Production Checklist

## Frontend

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm run preview` tested
- [ ] `.env` is not committed
- [ ] Production env uses `VITE_ENABLE_DEMO_FALLBACK=false`
- [ ] All customer routes tested
- [ ] All box-office routes tested
- [ ] All admin routes tested
- [ ] `/admin/integration` endpoint checks pass
- [ ] `/admin/production` reviewed
- [ ] Mobile layout tested
- [ ] Keyboard navigation tested
- [ ] Reduced-motion mode tested
- [ ] 404, 403 and 500 pages tested

## Backend/API

- [ ] Backend deployed
- [ ] CORS configured
- [ ] Refresh cookie works on production domain
- [ ] Auth roles work
- [ ] Seat locks expire correctly
- [ ] Bookings generate tickets
- [ ] Ticket QR tokens are secure
- [ ] Ticket PDF download works
- [ ] Payment callback verified
- [ ] Refund flow tested
- [ ] Audit logs created for admin actions

## Providers

- [ ] Payment provider sandbox tested
- [ ] Payment provider production credentials configured
- [ ] Email provider configured
- [ ] SMS provider configured if needed
- [ ] Media upload provider configured

## Deployment

- [ ] HTTPS enabled
- [ ] Domain connected
- [ ] SPA fallback configured
- [ ] Static asset caching configured
- [ ] Monitoring/logging configured
- [ ] Backup/rollback plan ready
