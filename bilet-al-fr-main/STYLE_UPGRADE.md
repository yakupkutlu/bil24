# Tiatru Style Upgrade — Phase 1

This update improves the public emotional experience of Tiatru and makes the website feel more cinematic, animated, premium, and theater-branded.

## Added Brand Components

```txt
src/components/brand/TheaterBackground.tsx
src/components/brand/CurtainOverlay.tsx
src/components/brand/SpotlightEffect.tsx
src/components/brand/GoldDivider.tsx
src/components/layout/PageTransition.tsx
src/components/layout/AnimatedSection.tsx
```

## Improved Visual Style

- Global dark theater atmosphere.
- Moving spotlight beams.
- Curtain fold background texture.
- Animated curtain opening on the home hero.
- Gold glow surfaces and premium buttons.
- Better hover effects and micro-interactions.
- Global route page transitions using Framer Motion.

## Improved Pages

```txt
/
/events
/events/:eventSlug
/showtimes/:showtimeId/seats
/checkout
/payment/success
```

## Improved Components

```txt
PublicLayout
Button
Card
EventCard
ShowtimeCard
SeatMapViewer
CheckoutSummary
TicketCard
QRCodeCard
```

## Recommended Next Phase

1. Add real poster assets instead of remote placeholder images.
2. Add skeleton loading states to public pages.
3. Improve mobile navigation drawer.
4. Add real QR scanner UI polish.
5. Add admin dashboard visual polish.
6. Add code splitting to reduce the production bundle warning.
