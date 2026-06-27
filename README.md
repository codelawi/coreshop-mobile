# CoreShop — Three-Sided Marketplace

A full-stack mobile marketplace inspired by Temu/Shein, built for the Jordanian market. CoreShop is the middleman between **sellers**, **clients**, and an **admin**.

---

## The Three Apps

| App | Stack |
|---|---|
| **Mobile** (`coreshop-mobile`) | Expo SDK 54, React Native, TypeScript, NativeWind, Expo Router |
| **Backend API** (`coreshop-api`) | Laravel 13, MySQL, Sanctum auth, Service pattern |
| **Dashboard** (`coreshop-dashboard`) | React + Vite, shadcn/ui, TanStack Router/Query |

---

## How It Works

**Sellers** register, get a store, upload products (images, variants, stock, price), and manage orders from within the same mobile app.

**Clients** browse stores/products, add to cart (single-store only), checkout with Cash on Delivery, and track their orders.

**Admin** approves sellers, products, and orders from the web dashboard.

---

## Design System (Mobile)

- **Brand color:** `#0A0A0A` black · **Accent:** `#FF4D4F` coral red
- **Backgrounds:** `#FAFAFA` light / `#0A0A0A` dark
- **Fonts:** Manrope (Latin) · IBM Plex Sans Arabic (Arabic)
- **Radius:** 8px sm / 10px default / 12px md / 16px lg
- **Animations:** Reanimated 3 — FadeInDown/FadeInUp, scale-on-press (0.98 / 80ms)

---

## Features Built

### Core Marketplace

- **Auth** — Email/password sign-in and sign-up
- **Guest mode** — App opens without requiring login; auth required only at checkout
- **Onboarding flow** — Profile + role → avatar (optional, Dicebear default) → location → permissions → interests
- **Home screen** — Banner carousel, category circles, flash deals, top stores, trending, featured products
- **Categories** — Master/detail: left rail of root categories, right pane with subcategory grid
- **Product detail** — Image gallery, discount badge, size/color variant picker, qty stepper, sticky add-to-cart
- **Single-store cart enforcement** — Cannot mix products from different stores; clear-and-add prompt
- **Search** — Debounced 400ms query, sort dropdown, filters
- **Store profile** — Banner, circular logo, stats, products grid
- **Wishlist** — Toggle with optimistic UI
- **Orders** — List + detail with status timeline
- **Addresses** — Full CRUD with map picker, reverse geocoding, default address
- **Checkout** — Address selection, delivery fee by Haversine distance, Cash on Delivery + CliQ (with copy button), order placement
- **Order cancellation** — Cancels order and restores items back to cart
- **Reviews** — Rate product + store after delivery
- **Profile tab** — User card, orders, wishlist, addresses, seller mode link, language switch, theme toggle, logout with confirmation

### Maps (Mapbox)

- Switched from Google Maps to `@rnmapbox/maps`
- Address creation form with drag-to-pin map + reverse geocoding
- Seller store setup with place search restricted to Jordan only (`country=JO`)
- Mapbox Geocoding API with Arabic + English results

### Seller Mode

- Store setup wizard — logo, banner, location pin, working hours
- Product CRUD — up to 7 images, variants editor (size, color, stock, price adjustment)
- Orders inbox — accept / mark ready / update status
- Sales analytics — overview, revenue chart, top products

### Push Notifications (Android Heads-Up)

- Diagnosed Android channel immutability issue — FCM auto-creates channels with DEFAULT importance; switching to channel ID `coreshop_v2` with `MAX` importance fixed heads-up banners
- Module-level channel setup in `notifications.ts` — channel exists before any push arrives
- `app.config.js` configured with `defaultChannel: "coreshop_v2"`
- Backend sends with `priority: "high"`, `sound: "default"`, `channelId: "coreshop_v2"` via Expo Push API
- Foreground notifications configured with `shouldShowBanner: true`

### Notification Persistence

- `user_notifications` table — stores every notification sent, with `read_at` timestamp
- `ExpoPushService::sendToUser()` always saves to DB even if user has no push token
- API endpoints: list notifications, unread count, mark one read, mark all read

### Offline Handling

- Axios interceptor detects `!error.response` (network error = offline)
- `useNetworkStore` (Zustand) — `isOffline` state accessible outside React
- `OfflineBanner` component — Reanimated slide-down banner with WiFi-off icon, auto-hides on reconnect

### Internationalisation

- Arabic and English with full RTL support (`I18nManager.forceRTL`)
- Arabic set as default language on first open
- Font swaps automatically per language (Manrope ↔ IBM Plex Sans Arabic)
- All user-facing strings in `locales/en.json` and `locales/ar.json`

### Dark Mode

- Full theme system — `bg-bg-light dark:bg-bg-dark`, `text-brand dark:text-white`
- Theme persisted in `useThemeStore`, applied via NativeWind

### Chat System

- Backend — migrations, models, controllers, routes for in-app messaging between client and seller
- Mobile — conversation list and message screen with real-time-style UX

---

## Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `users` | roles: admin/seller/client/driver; status; avatar; expo_push_token |
| `stores` | seller store with lat/lng, delivery radius, working hours |
| `products` | with variants, images, status workflow |
| `orders` | 10-status lifecycle (pending → completed/cancelled) |
| `order_items` | snapshot of product name/price/variant at time of order |
| `addresses` | saved delivery addresses with lat/lng |
| `conversations` + `messages` | in-app chat between client and seller |
| `user_notifications` | persisted push notifications with read status |
| `reviews` | product + store ratings after delivery |
| `coupons` | percentage or fixed discount |
| `banners` | home screen carousel, scheduled |

---

## Local Setup

### API (`coreshop-api`)
```bash
# Requires DBngin running MySQL on port 3306, database: coreshop
php artisan serve --host=0.0.0.0
# http://localhost:8000
```
Admin: `admin@coreshop.com` / `password123`
Sellers: `seller1@coreshop.com` … `seller5@coreshop.com` / `password123`

### Dashboard (`coreshop-dashboard`)
```bash
pnpm dev
# http://localhost:5173
```

### Mobile (`coreshop-mobile`)
```bash
npx expo start
```
`lib/api.ts` points to the Mac LAN IP (not localhost) so real devices can reach the API.

---

## Building the Mobile App

### Register Mapbox secret (one-time)
```bash
eas secret:create --scope project --name MAPBOX_DOWNLOAD_TOKEN --value <your_sk_token>
```

### Preview APK (for client testing)
```bash
eas build --platform android --profile preview
```
Produces a downloadable APK link. Client installs it directly.

### Production AAB (for Google Play)
```bash
eas build --platform android --profile production
eas submit --platform android --profile production --latest
```
Requires `google-play-service-account.json` in the project root and a Google Play Console app created.

---

## Tech Highlights

- **RTL full support** — Arabic direction switching at runtime
- **Single-store cart** — Can't mix products from different stores
- **Haversine distance** — Delivery fee calculated from real GPS distance
- **Cash on Delivery + CliQ** — CliQ username shown with one-tap copy
- **Reanimated 3** — Heavy animation system: entry effects, offline banner slide, button press scale
- **EAS Build** — `preview` profile for internal APK, `production` profile for Google Play AAB with auto-increment version
