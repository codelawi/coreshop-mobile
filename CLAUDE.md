Project: CoreShop
A full-stack e-commerce marketplace platform built across three apps that share one Laravel API. CoreShop is the middle-man between sellers and clients: sellers list products from their stores, clients order them, admin approves each order and dispatches delivery.

The Idea
Three-sided marketplace inspired by Temu/Shein aesthetics:

Sellers register, get a store, upload products (1–7 images, variants, stock, price, description), and run a mini-dashboard from inside the same mobile app.
Clients browse stores/products, add to cart (single-store enforcement), checkout with Cash on Delivery, track order through delivery.
Admin runs the web dashboard, approves sellers/products/orders, assigns drivers, handles disputes, sets platform fees.
Drivers (planned, backend-ready) pick up from seller, deliver to client.

Payment for v1 is Cash on Delivery only. Other payment methods marked "coming soon" and greyed in checkout. Multi-store cart is disabled — one order = one store.
Locations matter: stores have lat/lng + delivery radius, clients have saved addresses with lat/lng. Orders snapshot delivery coords, compute distance, derive delivery fee, and (future) show driver tracking live on a map.

Tech Stack
Dashboard (coreshop-dashboard) — React + Vite + TS, shadcn/ui + Tailwind, TanStack Router/Query, Zustand, Axios, react-hook-form + zod, sonner.
Backend (coreshop-api) — Laravel 12, MySQL via DBngin, Sanctum tokens, service-pattern architecture, soft deletes, Eloquent only (no raw SQL except selectRaw for aggregates / Haversine).
Mobile (coreshop-mobile) — Expo SDK 54 + Expo Router + TypeScript, NativeWind v4, Manrope + IBM Plex Sans Arabic fonts, HugeIcons (free), Zustand + TanStack Query, Axios + Expo SecureStore, react-hook-form + zod, sonner-native, react-native-reanimated (heavy animations), expo-image, expo-location, react-native-maps, i18next + expo-localization (EN/AR with RTL).
Storage — AWS S3 for avatars and product images (planned; URLs stored as strings in DB).

Design System (mobile)

Brand: #0A0A0A black, accent: #FF4D4F coral red, backgrounds #FAFAFA light / #0A0A0A dark
Font: Manrope (Latin) / IBM Plex Sans Arabic (Arabic)
Radius: soft — 8px sm / 10px default / 12px md / 16px lg
Product cards: dense — image, title, price (with original-strikethrough + discount badge), rating, sales count
Animations: heavy, via Reanimated 3 — entry FadeInDown/FadeInUp, subtle scale-on-press buttons (0.98 / 80ms)
Tabs: Home · Categories · Search · Cart · Profile (wishlist + orders inside profile)
Auth: email/password + Google (no Apple, no phone OTP)
RTL: full support via I18nManager.forceRTL, font swaps per language


General Rules — ALWAYS FOLLOW

No iOS emojis anywhere
TypeScript: import type for type-only imports
Backend: Eloquent only (no raw SQL); selectRaw for aggregates is OK
Backend: thin controllers; business logic lives in services
API response shape: { success, message, data, meta }
When sharing code edits, ALWAYS give the entire file, never partial snippets
Work one small step at a time. User says "done" when finished, then move to next step.
Chat style: minimal narration. No "what we did / what we'll do" recaps unless asked. No "now open localhost and…" — just say "test now". One concise step per message.
Mobile: when fixing input UX, kill iOS spellcheck underlines (spellCheck={false} + autoCorrect={false})


Database Schema (current)

users — roles: admin/seller/client/driver; status; avatar; onboarding_completed; phone; city; lat/lng; interests (json); soft deletes
categories — parent_id (tree), slug, image, icon, sort_order, is_active
stores — seller_id, name, slug, logo, banner, description, phone, address, city, lat/lng, delivery_radius_km, status (pending/active/suspended/closed), is_open, rating, reviews_count, sales_count, working_hours (json)
products — seller_id, store_id, category_id, name, slug, description, price, original_price, stock, weight_grams, status (pending_review/approved/flagged/removed), rating, reviews_count, sales_count, views_count, is_featured
product_images — product_id, url, sort_order, is_primary
product_variants — product_id, size, color, color_hex, sku, price_adjustment, stock, is_active
addresses — user_id, label, recipient_name, phone, address_line, building/floor/apartment, city, lat/lng, notes, is_default
orders — client_id, store_id, address_id, driver_id, coupon_id, status (pending/approved/preparing/ready_for_pickup/assigned/out_for_delivery/delivered/completed/cancelled/refunded), subtotal, discount, delivery_fee, distance_km, total, payment_method, payment_status, delivery_lat/lng, timestamps for each lifecycle stage
order_items — order_id, product_id, product_variant_id, product_name/image/variant_label snapshots, quantity, unit_price, total
banners — title, subtitle, image, link_type, link_value, sort_order, is_active, starts_at/ends_at
reviews — user_id, product_id (nullable), store_id (nullable), order_id, rating, comment, images (json)
coupons — type (percentage/fixed), value, active, etc.
personal_access_tokens — Sanctum


What's Done
Dashboard ✅
Sign in (Sanctum), guard, Overview, Orders, Products, Users, Coupons (CRUD), Analytics (6 charts). Wired live.
Backend ✅

Auth: login, register, me, logout, onboarding, password is hashed
Rate limit on login (5/min by email+IP)
CORS configured for http://localhost:5173
Admin endpoints: orders, products, users, coupons, analytics (incl. top-products, top-sellers)
Public client endpoints: /home (banners, categories, flash_deals, trending, featured, top_stores), /categories, /categories/{id}, /client/products, /client/products/{id}, /stores, /stores/{id} (with Haversine distance when lat/lng provided)
Authenticated client endpoints: addresses CRUD + setDefault
Marketplace seeder: categories tree, 5 sellers + stores in Amman, 8 products per store with images + variants for fashion, 3 banners
Order lifecycle expanded from 5 to 10 statuses

Mobile ✅

Project scaffold (Expo Router, TS, NativeWind, fonts, theme, i18n + RTL)
Auth: sign-in, sign-up (router.back for sign-in link)
Onboarding flow: avatar (Dicebear suggestions + device upload) → profile (name + role with Driver disabled) → location (map picker, auto GPS detection, reverse-geocoded city) → permissions (notifications + media) → interests (HugeIcons grid, min 3) → submit + redirect
Tabs: Home, Categories, Search, Cart, Profile (with safe-area-aware tab bar)
Home: banner carousel, category circles, flash deals, top stores, trending, featured, pull-to-refresh
Product detail: image gallery + dots, discount badge, store row, size/color variants, qty stepper, description, reviews preview, sticky add-to-cart, single-store-cart enforcement with clear-and-add prompt
Cart: list with qty steppers, remove, clear all, store header, subtotal, empty state
Search: debounced query (400ms), sort dropdown, filters placeholder
Categories tab: master/detail layout — left rail of root categories, right pane shows hero + subcategory grid
Category products screen at /category/[id]
Store profile at /store/[id] with banner, circular logo, stats, products grid
Profile tab: user card, my orders link, wishlist link (placeholder), addresses link, seller-only my-store link, language switch with RTL prompt, theme placeholder, settings placeholder, logout with confirmation
Addresses list screen with empty state, default badge, set-default, delete with confirm


What's Next (in order)

Address create/edit screens with map picker (route /addresses/new and /addresses/[id]) — this is the immediate next step
Checkout flow — address selection, delivery distance + fee calc, COD only (others greyed), place order; needs new backend endpoints POST /orders, GET /orders (mine), GET /orders/{id}
Orders screen (/orders) — list + detail with status timeline + live driver location placeholder
Seller mode — store setup wizard for users with role=seller (logo, banner, address pin, working hours), product CRUD (multi-image picker with up to 7 + S3 upload, variants editor), orders inbox (accept / mark ready), sales analytics, payouts placeholder
Reviews submission after delivery (rate product + store, optional images)
Wishlist — backend table + endpoints, mobile screen, optimistic toggle
Email verification flow — verify-email screen wired to /auth/resend-verification and verification link
Notifications center + Expo Push setup, backend dispatch on order status changes
Chat with seller (in-app messaging on product detail) — nice-to-have
Driver app slice — when ready (backend already supports it)


Pre-Release Updates Needed

S3 setup for avatars and product images (config + upload service + signed URLs)
Image CDN in front of S3 (CloudFront) for fast loads + on-the-fly transforms
Push notifications wired end-to-end (Expo Push token capture, backend dispatch)
Skeleton loaders everywhere instead of spinners
Optimistic UI for cart/wishlist
Offline cart sync on reconnect (already persisted, just needs reconcile logic)
Pagination + infinite scroll on all list endpoints — current paginated mobile screens just render first page
Search suggestions + recent searches
Crash reporting — Sentry
Analytics SDK — PostHog (free tier)
App-wide error boundary + global toast on network failures
Deep links for product/store URLs
Real product photos to replace picsum.photos/seed/... seeded images
Email verification and forgot-password actually wired (currently stubbed)
Google OAuth actually wired (button shows "coming soon" toast right now)
Admin dashboard sections for: stores approval, sellers approval, banners CRUD, categories CRUD, reviews moderation, payouts
Translations — many user-facing strings still in English; need to move into locales/{en,ar}.json
Dark mode — design system supports it, mobile theme store not yet built
Tablet/large-screen layouts for mobile
Accessibility audit — labels, hit slop, contrast
Rate limiting beyond /auth/login (especially /auth/register, /orders, /reviews)
Image validation on uploads (size, mime, dimensions)
Order auto-cancel if seller doesn't accept within X minutes
Distance-based delivery fee formula — currently zero/placeholder
Seller payout calculation + ledger
Production env — DB credentials, S3 keys, Sanctum stateful domains, CORS prod origins, force HTTPS


Local Setup
Dashboard — ~/coreshop-dashboard, pnpm dev, http://localhost:5173
API — ~/coreshop-api, php artisan serve --host=0.0.0.0, http://localhost:8000, MySQL via DBngin on 3306, db coreshop.

Admin: admin@coreshop.com / password123. Seeded sellers: seller1..5@coreshop.com / password123.
Mobile — ~/coreshop-mobile, npx expo start. lib/api.ts points at the Mac LAN IP, not localhost, because real devices/emulators can't reach the host on localhost. .npmrc has legacy-peer-deps=true because react-dom@19.2.7 peers don't align with react@19.1.0 shipped by Expo SDK 54.