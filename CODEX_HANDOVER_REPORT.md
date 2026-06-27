# RestaurantAI Codex Handover Report

Generated: 2026-06-27
Scope: RestaurantAI production hardening checkpoints and handover notes.

## Phase 3 - Luxury Restaurant Website Experience

Scope:

- Public restaurant website experience only.
- Existing ordering, reservations, chatbot, menu, gallery, dynamic SEO, cart persistence, and admin editability were preserved.
- No backend schema changes were made.

Audit findings:

- The public restaurant page already had a premium base with dynamic SEO, JSON-LD, cart persistence, menu filters, gallery, reservation flow, order modal, and chatbot integration.
- `frontend/components/RestaurantSite.tsx` had grown into a large all-in-one component mixing layout, theme presentation, menu UI, reservation UI, cart modal, order timeline, helper functions, and API behavior.
- Theme presets existed, but they needed stronger visual mood separation and a dark steakhouse option.
- Chatbot presentation worked, but customer-facing copy still felt closer to a menu guide than a premium AI Maître d' experience.
- Ordering needed clearer payment expectation copy because online payment is not implemented.

Implementation summary:

- Refactored the public restaurant page into reusable luxury sections:
  - `RestaurantHero`
  - `TrustAndStory`
  - `MenuShowcase`
  - `GalleryShowcase`
  - `ReservationPanel`
  - `OrderCartDrawer`
  - shared `experience` helpers
- Kept stateful behavior in `RestaurantSite.tsx`:
  - cart persistence
  - order submission
  - successful order cart clearing
  - failed order cart preservation
  - reservation submission
  - JSON-LD injection
  - chatbot wiring
- Upgraded the hero so the restaurant name is the primary first-viewport identity.
- Added stronger reservation/menu CTAs, trust badges, direct-with-restaurant reassurance, service-mode copy, and payment-at-restaurant/on-delivery clarity.
- Added richer theme tokens for image treatment and trust-panel mood.
- Added `Steakhouse Dark` to frontend theme resolution and backend seed data so it can be selected from admin theme data without a schema change.
- Improved chatbot language to use AI Maître d' and added a friendly rate-limit message.
- Improved frontend API error parsing for structured FastAPI `detail.message` responses.

New premium theme moods:

- Fine Dining Gold
- Italian Luxury
- Japanese Minimal
- Steakhouse Dark
- Modern Cafe
- Vegan Natural
- Mediterranean Fresh fallback

Files changed:

- `frontend/components/RestaurantSite.tsx`
- `frontend/components/ChatWidget.tsx`
- `frontend/lib/api.ts`
- `frontend/lib/restaurantTheme.ts`
- `frontend/lib/restaurantTheme.test.ts`
- `frontend/app/globals.css`
- `frontend/components/RestaurantSite.test.tsx`
- `frontend/components/ChatWidget.test.tsx`
- `backend/app/services/seed.py`
- `frontend/components/public/restaurant/RestaurantHero.tsx`
- `frontend/components/public/restaurant/TrustAndStory.tsx`
- `frontend/components/public/restaurant/MenuShowcase.tsx`
- `frontend/components/public/restaurant/GalleryShowcase.tsx`
- `frontend/components/public/restaurant/ReservationPanel.tsx`
- `frontend/components/public/restaurant/OrderCartDrawer.tsx`
- `frontend/components/public/restaurant/experience.ts`
- `CODEX_HANDOVER_REPORT.md`

Validation:

- `cd frontend && pnpm test`: passed, `7` test files and `25` tests.
- `cd frontend && pnpm build`: passed, production build and TypeScript completed successfully.
- `cd backend && python -m pytest`: passed, `32` tests with `66` warnings.
- Encoding marker scan across frontend/backend/docs/config targets: no matches found.

Remaining recommendations:

- Perform browser-level visual QA on desktop and mobile before demo.
- Add Next.js image optimization or CDN image transformation once remote image/storage strategy is finalized.
- Online payment is still not implemented; current UI clarifies payment is handled by the restaurant.
- Reservations remain request-based, not capacity/table-inventory bookings.
- Admin editor and onboarding components remain large and should be decomposed in later milestones.

## Task 1.6 - Cloud Storage Preparation And Upload Safety

Audit findings:

- Image uploads were handled directly inside `backend/app/api/admin.py`.
- Uploaded images were stored on the local filesystem under `settings.upload_dir/{restaurant_id}/`.
- Local files are served publicly through FastAPI static files at `/uploads`.
- Image URLs are stored as `/uploads/{restaurant_id}/{filename}` in `RestaurantImage.url`, `restaurant.logo_url`, and `restaurant.hero_image`.
- Current image validation allowed JPG, PNG, WEBP, and GIF by content type and enforced an 8 MB size limit.
- Document uploads were stored under `uploads/{restaurant_id}/documents`.
- Document filenames were path-basename sanitized, but storage and validation logic lived in route handlers.
- Local storage is fine for development and demos, but production needs a cloud/object-storage provider, durable backups, CDN support, malware scanning strategy, and tenant-aware deletion.

Implementation summary:

- Added `backend/app/services/storage.py` with:
  - `StorageService`
  - `LocalStorageProvider`
  - `StoredFile`
  - image/document validation helpers
  - future provider seam for S3/R2-style object storage
- Kept local upload URLs and existing API contracts unchanged.
- Added `STORAGE_PROVIDER=local` configuration in:
  - `backend/app/core/config.py`
  - `.env.example`
  - `docker-compose.yml`
  - `README.md`
- Moved image saving, document saving, and upload deletion through the storage service.
- Added upload validation for:
  - allowed image MIME types
  - image max size: 8 MB
  - document max size: 10 MB
  - safe generated filenames
  - dangerous extensions such as `.php`, `.exe`, `.js`, `.sh`, `.svg`
  - image extension/content-type mismatch
- Ensured document size/filename validation runs before text extraction.

Files changed:

- `backend/app/core/config.py`
- `backend/app/api/admin.py`
- `backend/app/services/storage.py`
- `backend/tests/test_storage.py`
- `.env.example`
- `docker-compose.yml`
- `README.md`
- `CODEX_HANDOVER_REPORT.md`

Validation:

```powershell
cd backend
python -m pytest
```

Result: `32 passed, 66 warnings`.

Frontend validation:

- Not run, because no frontend files were changed.

Remaining recommendations:

- Add an `ObjectStorageProvider` for S3/R2 when production hosting is selected.
- Add content sniffing or image decoding verification before launch with untrusted uploads.
- Add antivirus/malware scanning for documents before production use.
- Move public uploads behind CDN/object storage and signed administrative delete operations later.

## Restaurant Owner Onboarding Wizard

Audit findings:

- Restaurant creation previously lived at `/admin/restaurants/new` as a short technical form.
- After creation, owners had to move through separate admin screens for information, design, images, menu, opening hours, and chatbot knowledge.
- Theme selection, image uploads, menu/category creation, and document upload already existed and could be reused.
- The confusing part was sequencing: a non-technical restaurant owner had to understand the dashboard structure before reaching a publishable site.
- Existing AI/chatbot configuration is knowledge-driven rather than a dedicated settings model, so the wizard should avoid exposing technical AI settings.

Implementation summary:

- Replaced the old short new-restaurant form with an eight-step onboarding wizard at `/admin/restaurants/new`.
- Wizard steps:
  1. Welcome
  2. Restaurant information
  3. Brand and theme with logo/hero uploads
  4. Opening hours
  5. Starter menu with categories, dishes, prices, dietary tags, and allergens
  6. Menu guide / AI assistant preferences
  7. Review
  8. Publish and success links
- Added local draft autosave with `restaurantai.onboarding.v1`.
- Reused existing admin APIs for:
  - restaurant creation
  - theme selection
  - image upload
  - category creation
  - menu item creation
  - knowledge document upload
- On publish, the wizard creates a normal restaurant record, uploads launch images, creates starter menu content, and uploads assistant launch notes as a text knowledge document.
- Added live brand preview during the brand step.
- Added a success state with public website preview and dashboard links.
- Added a minimal backend permission improvement so restaurant owners can create restaurants assigned to themselves, while super admins can still assign owners.

Files changed:

- `frontend/app/admin/restaurants/new/page.tsx`
- `frontend/app/admin/restaurants/new/page.test.tsx`
- `backend/app/api/admin.py`
- `backend/tests/test_tenant_safety.py`
- `CODEX_HANDOVER_REPORT.md`

Validation:

```powershell
cd frontend
pnpm.cmd test
pnpm.cmd build

cd backend
python -m pytest
```

Results:

- Frontend tests: `7 passed`, `23 tests`.
- Frontend build: passed.
- Backend tests: `26 passed, 66 warnings`.

Remaining recommendations:

- Add a real persisted AI assistant settings model later if owners need configurable language/reservation/order behavior beyond knowledge notes.
- Add drag-and-drop dish ordering and menu CSV import after the MVP proves useful.
- Add image cropping and basic quality guidance for logo/hero uploads.
- Add a browser-based visual QA pass for the full wizard on mobile and tablet.
- Consider an owner-specific first-login redirect into the wizard when an owner has no restaurant yet.

## Authentication Security Audit

Audit findings:

- Current admin login flow still stores the returned Bearer JWT in frontend `localStorage` under `restaurant_ai_token`.
- Backend Bearer validation happens in `backend/app/dependencies.py` through the `Authorization: Bearer ...` header.
- Backend already supports optional HttpOnly cookie authentication when `AUTH_COOKIE_ENABLED=true`.
- `AUTH_COOKIE_ENABLED` defaults to `false`, so existing admin login behavior remains unchanged.
- Cookie auth is additive: Bearer tokens still work and take priority over cookies.
- Logout clears the auth cookie on the backend, but the current frontend logout still only removes the localStorage token because the frontend migration has not started.

Risks:

- `localStorage` tokens are exposed to successful XSS, browser extensions, and any injected script running on the admin origin.
- Long-lived access tokens increase impact if a token is stolen.
- HttpOnly cookies reduce script access, but require a CSRF strategy before they become the primary browser auth mechanism.
- Cookie mode should use `AUTH_COOKIE_SECURE=true` in production behind HTTPS.

Migration plan:

1. Keep current Bearer/localStorage login as the compatibility path.
2. Enable backend cookie support in a controlled environment with `AUTH_COOKIE_ENABLED=true`.
3. Add CSRF protection for state-changing admin requests before making cookies the primary browser auth mechanism.
4. Migrate the frontend to rely on same-origin HttpOnly cookies and call backend logout.
5. Remove localStorage token storage only after cookie auth, CSRF, logout, and rollback have been validated.

Safe improvements implemented:

- Added `Cache-Control: no-store` and `Pragma: no-cache` headers to auth responses:
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /auth/me`
- Added tests verifying:
  - existing Bearer login response remains unchanged by default.
  - Bearer auth still works.
  - auth responses are not cacheable.
  - cookie auth works when enabled.
  - cookie auth uses HttpOnly plus configurable Secure and SameSite flags.
  - logout clears the cookie.
  - Bearer auth still takes priority over an invalid cookie.
- No frontend files were changed.

Files changed:

- `backend/app/api/auth.py`
- `backend/tests/test_auth_cookies.py`
- `CODEX_HANDOVER_REPORT.md`

Validation:

```powershell
cd backend
python -m pytest
```

Result: `24 passed, 66 warnings`.

Frontend validation:

- Not run, because no frontend files were changed.

Remaining recommendations:

- Add CSRF protection before enabling cookie auth as the default browser flow.
- Add refresh/session revocation if real restaurant owners will rely on long-lived admin sessions.
- Reduce token lifetime for production and consider refresh-token rotation.
- Frontend migration should be a separate milestone.

## Chat API Rate Limiting And Abuse Protection

Audit findings:

- A simple in-memory rate limiter already exists in `backend/app/core/rate_limit.py`.
- Public chat endpoints are already protected through route dependencies in `backend/app/api/public.py`:
  - `POST /api/restaurants/{slug}/chat`
  - `POST /api/chat`
- Public non-chat endpoints use separate reservation, order, and general-public rate-limit buckets.
- Limits are configurable through environment variables in `.env.example` and Docker Compose.
- Trusted proxy headers are disabled by default through `TRUST_PROXY_HEADERS=false`.
- Admin routes are not wired into the public limiter, so normal dashboard usage is not accidentally blocked.

Implementation summary:

- Kept the existing MVP-safe in-memory limiter instead of adding Redis or rewriting middleware.
- Added backend tests proving:
  - default chat protection is `10` messages per minute per IP.
  - chat and general public API limits use separate buckets.
  - chat limiting is per IP when trusted proxy headers are explicitly enabled.
- Documented rate-limit environment variables in `README.md`.
- Left frontend, backend API behavior, database schema, admin routes, and OpenAI integration unchanged.

Files changed:

- `backend/tests/test_rate_limit.py`
- `README.md`
- `CODEX_HANDOVER_REPORT.md`

Validation:

```powershell
cd backend
python -m pytest
```

Result: `23 passed, 63 warnings`.

Frontend validation:

- Not run, because this milestone did not touch frontend code.

Remaining recommendations:

- Keep this in-memory limiter for local demos and single-process MVP deployments.
- Before multi-instance production, move rate-limit state to Redis or another shared store.
- Add basic observability dashboards for HTTP 429 counts and chat request volume before paid demos at scale.

## Customer Experience Design Polish - Public Restaurant Website

Audit decision:

- The public homepage currently renders the default restaurant through `PublicShell`, so it should behave as a restaurant-owned customer homepage, not a SaaS marketing homepage.
- The SaaS/admin product remains separate from the public customer journey.
- Customer-facing pages still had platform-flavored copy such as RestaurantAI, AI Maitre d', software, and hospitality-online language.
- The restaurant page already had premium structure, menu cards, gallery, reservation, ordering, cart, and chat integration, but several labels made the experience feel like a platform demo instead of the restaurant's own website.

Files changed:

- `frontend/app/page.tsx`
- `frontend/app/page.test.tsx`
- `frontend/components/RestaurantSite.tsx`
- `frontend/components/RestaurantSite.test.tsx`
- `frontend/components/ChatWidget.tsx`
- `frontend/components/ChatWidget.test.tsx`
- `frontend/components/Footer.tsx`
- `frontend/lib/restaurantTheme.ts`
- `CODEX_HANDOVER_REPORT.md`

Improvements implemented:

- Reduced public RestaurantAI/platform language from restaurant-owned customer pages.
- Reframed the homepage around customer intent: what the restaurant serves, where it is, how to view the menu, how to reserve, and how to order.
- Updated restaurant page hero, menu, signature dish, empty-menu, gallery, story, footer, and chat copy to focus on food, atmosphere, trust, reservation, and ordering.
- Renamed visible chat entry points from AI Maitre d' to restaurant-owned menu guide language while preserving the same chat behavior.
- Strengthened theme personality copy so each preset feels more distinct:
  - Michelin Fine Dining: quiet luxury.
  - Italian Warm: family, fire, wine, shared-table warmth.
  - Sushi Minimal: Japanese precision and calm sequencing.
  - Vegan Natural: fresh, plant-led, seasonal clarity.
  - Modern Cafe: cozy, bright, all-day comfort.
- Kept backend schema, API contract, auth, payments, and admin dashboard behavior unchanged.

Validation:

- `cd frontend; pnpm.cmd test` passed: 6 test files, 21 tests.
- `cd frontend; pnpm.cmd build` passed: Next.js compiled successfully, TypeScript passed, 12 static pages generated.

Remaining recommendations:

- Perform a live browser visual QA pass on restaurant themes with real images before presenting to restaurant owners.
- Later, consider a separate owner-facing SaaS marketing page if the product needs public B2B acquisition; do not mix that with restaurant customer pages.
- Add visual regression screenshots once the public design stabilizes.

## Task 1.1 - Dynamic SEO Audit And Production Completion

Audit findings:

- Global metadata lives in `frontend/app/layout.tsx` and correctly keeps admin/general pages on RestaurantAI branding.
- Public restaurant metadata already existed in `frontend/app/restaurants/[slug]/page.tsx`, but it was only partially production-ready.
- Dynamic title, description, keywords, canonical URL, Open Graph, Twitter cards, and robots metadata existed for `/restaurants/[slug]`.
- `NEXT_PUBLIC_SITE_URL` was already available in `.env.example`, but SEO URL generation was not centralized.
- Restaurant JSON-LD existed in `frontend/components/RestaurantSite.tsx`, but it was component-local and less complete than schema.org best practice.
- No `frontend/app/sitemap.ts` existed.
- No `frontend/app/robots.ts` existed.
- Public restaurant pages loaded restaurant content through a client-side fetch after hydration, which was weaker for SEO and duplicated the restaurant request after metadata generation.
- Backend had public single-restaurant endpoints but no public published-restaurant list for sitemap generation.

Improvements implemented:

- Added shared SEO helpers in `frontend/lib/restaurantSeo.ts`.
- Restaurant pages now generate production-oriented metadata from existing restaurant data:
  - unique SEO title
  - dynamic SEO description
  - intelligent keywords
  - canonical URL
  - robots index/follow for published pages
  - Open Graph title, description, URL, locale, site name, and large image
  - Twitter `summary_large_image` card when an image exists
  - image alt metadata
- JSON-LD now uses the shared SEO helper and includes:
  - `Restaurant` schema type
  - stable `@id`
  - name, description, URL
  - logo and images
  - phone and email
  - postal address
  - cuisine
  - inferred price range
  - menu URL
  - reservation action
  - social links
  - opening hours specification when structured hours are available
- Added `frontend/app/sitemap.ts`.
  - Includes static public pages.
  - Includes all published restaurants from the backend public list endpoint.
  - Uses dynamic rendering so future restaurants can appear without frontend code edits.
- Added `frontend/app/robots.ts`.
  - Allows public pages and restaurant pages.
  - Disallows admin and API paths.
  - Points crawlers to the sitemap when `NEXT_PUBLIC_SITE_URL` is configured.
- Added a minimal backend public endpoint, `GET /api/restaurants`, returning published restaurant summaries only.
- Added a backend regression test verifying the public sitemap source excludes unpublished restaurants.
- Updated `/restaurants/[slug]` to pass server-fetched restaurant data into the client page so crawlers receive real restaurant content earlier and the browser avoids the normal duplicate initial fetch.

Files changed:

- `backend/app/api/public.py`
- `backend/app/schemas.py`
- `backend/tests/test_tenant_safety.py`
- `frontend/app/restaurants/[slug]/RestaurantWebsiteClient.tsx`
- `frontend/app/restaurants/[slug]/page.tsx`
- `frontend/app/robots.ts`
- `frontend/app/sitemap.ts`
- `frontend/components/RestaurantSite.tsx`
- `frontend/lib/restaurantSeo.ts`
- `frontend/lib/types.ts`
- `CODEX_HANDOVER_REPORT.md`

Validation:

```powershell
cd frontend
pnpm build
```

Result: passed.

```powershell
cd frontend
pnpm test
```

Result: 4 test files passed, 14 tests passed.

```powershell
cd backend
python -m pytest
```

Result: 20 tests passed, 60 warnings.

Remaining SEO recommendations:

- Configure `NEXT_PUBLIC_SITE_URL` to the real production domain before launch. Production intentionally does not fall back to localhost.
- Add real geo coordinates to the restaurant model later if map/local SEO precision becomes a priority.
- Add aggregate ratings only after real review/rating data exists. No fake rating data was invented.
- Consider generating dedicated 1200x630 social preview images per restaurant when branding assets mature.
- Add Search Console/Bing Webmaster validation after deployment.
- Add E2E checks for `/sitemap.xml`, `/robots.txt`, and selected restaurant metadata once Playwright is introduced.

## Task 1.2 - Cart Persistence Verification

Status:

- Cart persistence was already implemented in `frontend/lib/cartStorage.ts` and wired into `frontend/components/RestaurantSite.tsx`.
- No backend schema changes were made.
- No UI/UX changes were made.

Implementation verified:

- Cart state is persisted in `localStorage`.
- Storage is scoped per restaurant using `restaurant.slug || restaurant.id`.
- Storage key format is versioned: `restaurantai.cart.{restaurant-slug-or-id}.v1`.
- Cart restore runs only after client hydration through `useEffect`, avoiding hydration mismatch risk.
- Corrupted JSON is caught safely, removed from `localStorage`, and treated as an empty cart.
- Old or unsupported storage versions are ignored.
- Successful order submission clears React cart state and removes the persisted cart.
- Failed order submission leaves the persisted cart intact.

Frontend tests updated:

- Existing restore-after-remount test remains in place.
- Added coverage for clearing persisted cart only after successful order.
- Added coverage for preserving persisted cart when order submission fails.
- Added coverage for corrupted persisted cart JSON.

Validation:

```powershell
cd frontend
pnpm test
```

Result: 4 test files passed, 17 tests passed.

```powershell
cd frontend
pnpm build
```

Result: passed.

## Task 1.3 - Premium Loading Experience

Status:

- Added a premium public restaurant loading skeleton.
- No backend schema changes were made.
- No unrelated features were added.
- Existing restaurant page UI remains unchanged once data has loaded.

Implementation summary:

- Added `frontend/components/RestaurantPageSkeleton.tsx`.
  - Mirrors the public restaurant page structure with a cinematic hero, visual panel, and menu-card placeholders.
  - Uses fixed dimensions and responsive layout to reduce layout shift.
  - Keeps the Michelin/luxury visual language during loading instead of showing plain text.
- Added `frontend/app/restaurants/[slug]/loading.tsx`.
  - Next.js now shows the premium skeleton while the dynamic restaurant route is loading.
- Updated `frontend/app/restaurants/[slug]/RestaurantWebsiteClient.tsx`.
  - Client-side fallback now uses the same premium skeleton if no initial restaurant data is available.
- Updated `frontend/components/RestaurantSite.tsx`.
  - Order modal now shows a refined in-flight state while an order is being submitted.
  - Confirm button is disabled during submission to avoid duplicate orders.
  - Order status uses polite live-region semantics.
- Updated `frontend/components/ChatWidget.tsx`.
  - Starter prompt buttons are disabled while the AI response is loading.
  - Chat loading state now announces politely for assistive technology.

Frontend tests updated:

- Added `frontend/app/restaurants/[slug]/RestaurantWebsiteClient.test.tsx`.
- Added coverage that the premium restaurant loading skeleton appears while restaurant data is loading.
- Strengthened the cart/order test to verify the order modal shows and disables the confirming state during submission.

Validation:

```powershell
cd frontend
pnpm test
```

Result: 5 test files passed, 18 tests passed.

```powershell
cd frontend
pnpm build
```

Result: passed.

## Task 1.4 - Mobile Excellence

Mobile audit findings:

- Tested the public restaurant page at 390x844, 375x812, 412x915, and 768x1024.
- Tested public homepage and contact page at 390x844.
- No horizontal scrolling was detected on the audited public pages.
- Public restaurant page had several mobile comfort issues:
  - mobile menu toggle was slightly below the 44px touch target target.
  - menu filter buttons were slightly under 44px high.
  - category anchor chips were too short for comfortable thumb use.
  - tablet header navigation links were visually elegant but too small as touch targets.
  - cart quantity controls were compact inside the order sheet.
  - chat and cart floating controls needed safer spacing around mobile safe areas.
  - order/reservation inputs needed better mobile keyboard hints.
  - hero was full-height on phones, making the menu feel farther away than necessary.

Improvements made:

- Reduced phone hero height from full-screen to a denser premium mobile hero while preserving the desktop/tablet cinematic layout.
- Improved hero type scaling with `clamp()` for small screens.
- Made hero CTAs full-width and easier to tap on phones.
- Reworked the mobile navigation menu into a bottom tray for easier one-handed access.
- Increased touch targets for:
  - mobile menu toggle
  - tablet/desktop nav links
  - menu dietary filters
  - category chips
  - cart quantity controls
  - cart close button
  - order type selector
  - order submit button
  - chatbot close, send, quick prompt, and quick action buttons
- Added safe-area-aware bottom positioning for floating cart and chatbot controls.
- Made the chatbot behave more like a premium mobile sheet on phones.
- Improved cart sheet spacing and line-item controls for thumb use.
- Added mobile keyboard hints and autocomplete attributes to:
  - reservation form
  - public contact form
  - order checkout form
  - delivery address fields
- Added global focus-visible outlines and scroll padding for anchored sections.

Verification:

- Browser mobile audit after changes:
  - 390x844: no horizontal overflow, no detected visible touch targets under 44px.
  - 375x812: no horizontal overflow, no detected visible touch targets under 44px.
  - 412x915: no horizontal overflow, no detected visible touch targets under 44px.
  - 768x1024: no horizontal overflow, no detected visible touch targets under 44px.

Files changed:

- `frontend/app/contact/page.tsx`
- `frontend/app/globals.css`
- `frontend/components/ChatWidget.tsx`
- `frontend/components/RestaurantSite.tsx`
- `CODEX_HANDOVER_REPORT.md`

Validation:

```powershell
cd frontend
pnpm test
```

Result: 5 test files passed, 18 tests passed.

```powershell
cd frontend
pnpm build
```

Result: passed.

Remaining recommendations:

- Add Playwright visual regression checks for the same four mobile/tablet viewport sizes.
- Consider a dedicated mobile category rail with active-section highlighting in a later task.
- Consider a true native-app-style bottom navigation only if analytics show guests use many sections per visit.

## Premium Restaurant Customization

Audit findings:

- The backend already had `Theme` rows with palette, typography, button, homepage, menu, and gallery style fields.
- Restaurants already had per-restaurant override fields for colors, font, button style, homepage style, menu style, and gallery style.
- The admin design screen already allowed owners to pick a theme and adjust core brand controls.
- The public restaurant page used theme values, but logic was scattered:
  - colors and font were resolved inline.
  - personality/story tone lived in a local component map.
  - menu/gallery variants were only partially connected.
  - admin preview used its own simpler visual logic.
- The seed catalog contained useful foundations but did not cleanly match the requested premium set.

Improvements made:

- Added `frontend/lib/restaurantTheme.ts` as the reusable public theme architecture.
- The resolver now centralizes:
  - color palette
  - typography feel
  - button/CTA style
  - hero overlay and fallback
  - shell background
  - menu card treatment
  - gallery layout
  - restaurant personality/story copy
- Premium identities now supported:
  - Michelin Fine Dining
  - Modern Cafe
  - Italian Warm
  - Sushi Minimal
  - Vegan Natural
- Updated `frontend/components/RestaurantSite.tsx` to consume the resolved theme identity instead of scattered local checks.
- Updated the admin design editor:
  - theme cards now show style chips for hero/menu/gallery behavior.
  - manual controls expose typography, button, hero, menu, and gallery style choices.
  - design education now explains what each theme controls.
  - live preview now uses the same theme resolver as the public site.
- Updated backend seed themes without changing schema:
  - refreshed Michelin Fine Dining copy.
  - replaced the old fast-food seed with Italian Warm.
  - renamed Japanese preset to Sushi Minimal.
  - added Vegan Natural.
  - existing theme rows are refreshed on seed startup.
- Added frontend tests for theme resolution and restaurant-level overrides.

Files changed:

- `backend/app/services/seed.py`
- `frontend/components/RestaurantSite.tsx`
- `frontend/components/admin/RestaurantEditor.tsx`
- `frontend/lib/restaurantTheme.ts`
- `frontend/lib/restaurantTheme.test.ts`
- `CODEX_HANDOVER_REPORT.md`

Validation:

```powershell
cd frontend
pnpm test
```

Result: 6 test files passed, 21 tests passed.

```powershell
cd frontend
pnpm build
```

Result: passed.

```powershell
cd backend
python -m pytest
```

Result: 20 tests passed, 60 warnings.

Visual verification recommendation:

- Open the admin design page for a restaurant.
- Select each premium theme.
- Confirm the live preview changes palette, typography, hero mood, CTA shape, menu style labels, and gallery style labels.
- Open `/restaurants/bella-napoli` and verify the public website still feels premium and reflects the selected theme/overrides.

## Admin Dashboard React Key Fix

Issue:

- React reported duplicate child keys in `frontend/app/admin/dashboard/page.tsx`.
- Root cause: `insights.aiQuestions.map` used `key={question}`, but duplicate unanswered question text can exist.

Fix:

- Updated `insights.aiQuestions.map` to use a composite key: `${question}-${index}`.
- Reviewed other `map()` calls in the admin dashboard.
- Also updated duplicate-prone string/name keys for:
  - best-seller rows
  - daily recommendation rows
  - setup warning rows
- No app behavior was changed.

Files changed:

- `frontend/app/admin/dashboard/page.tsx`
- `CODEX_HANDOVER_REPORT.md`

Validation:

```powershell
cd frontend
pnpm test
```

Result: 6 test files passed, 21 tests passed.

```powershell
cd frontend
pnpm build
```

Result: passed.

## Phase 1.5 - Frontend Testing Foundation

Files changed:

- `.github/workflows/ci.yml`
- `frontend/app/admin/login/page.test.tsx`
- `frontend/app/page.test.tsx`
- `frontend/components/ChatWidget.test.tsx`
- `frontend/components/RestaurantSite.test.tsx`
- `frontend/package.json`
- `frontend/pnpm-lock.yaml`
- `frontend/test/fixtures.ts`
- `frontend/test/setup.ts`
- `frontend/test/test-utils.tsx`
- `frontend/vitest.config.ts`
- `CODEX_HANDOVER_REPORT.md`

Testing framework chosen:

- Vitest for fast TypeScript/React component tests.
- React Testing Library for user-focused DOM assertions.
- `@testing-library/user-event` for realistic interactions.
- jsdom for browser-like component execution without full E2E overhead.
- `@testing-library/jest-dom` for readable assertions.

Reasoning:

- The frontend is a Next.js App Router app with client-heavy public/admin flows.
- Vitest plus React Testing Library is lightweight, maintainable, and deterministic for component-level regression coverage.
- Playwright is still recommended later for real browser E2E and visual smoke tests, but it would be heavier than needed for this milestone.

Tests added:

- Homepage:
  - Renders after mocked restaurant load.
  - Hero section is visible.
  - Primary CTA links exist.
  - Navigation links are present.
  - Mobile-width render keeps the hero available.
- Restaurant page:
  - Restaurant hero and menu render from existing data.
  - Menu categories and menu items display.
  - Sold-out item state displays and disables ordering.
  - Dietary tags render.
  - Gallery images render.
  - Chatbot trigger renders.
  - Mobile-width render keeps key page surfaces available.
- Cart:
  - Add item.
  - Quantity update.
  - Remove item.
  - Total recalculation.
  - Persistence after remount through localStorage cart storage.
- Chat widget:
  - Widget opens.
  - Send button is disabled for empty input and enabled for valid text.
  - Loading state appears.
  - Successful mocked response renders.
  - Error state renders without calling OpenAI.
- Admin login:
  - Form renders.
  - Required fields prevent submit.
  - Loading state appears.
  - Successful mocked login stores token and navigates.
  - Error state renders.

CI update:

- Pull Request frontend job now runs `pnpm install`, `pnpm test`, and `pnpm build`.
- Pull Request backend job runs `python -m pytest`.

Validation:

```powershell
cd frontend
pnpm test
```

Result: `4 passed`, `14 passed`.

```powershell
cd frontend
pnpm build
```

Result: passed. Next.js compiled successfully and TypeScript passed.

```powershell
cd backend
python -m pytest
```

Result: `19 passed, 59 warnings`.

Future testing recommendations:

- Add Playwright E2E smoke tests for real browser flows: public restaurant page, cart order flow, admin login, and mobile navigation.
- Add API contract fixtures so backend/frontend schema drift is caught earlier.
- Add visual regression screenshots for the premium public restaurant website once the design stabilizes.
- Add admin dashboard editing-flow coverage after the public journey is protected.

## Public Restaurant Website Luxury Redesign

Files changed:

- `frontend/app/globals.css`
- `frontend/app/page.tsx`
- `frontend/components/ChatWidget.tsx`
- `frontend/components/RestaurantSite.tsx`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Redesigned the public homepage as a cinematic restaurant entry experience using existing restaurant data and imagery.
- Upgraded `/restaurants/[slug]` hero treatment with stronger identity, refined CTAs, luxury trust signals, and richer visual framing.
- Improved menu presentation with editorial section headings, premium cards, richer price hierarchy, pairing notes, dietary/allergen tags, and sold-out state treatment.
- Refined gallery, visit, reservation, and floating cart styling for a more high-end hospitality feel.
- Reworked chatbot presentation into a more premium AI Maitre d' / concierge layer.
- Added reusable luxury CSS helpers for shadows, dividers, button motion, shell background, and menu card surfaces.
- Did not change backend schema, auth, payments, admin dashboard logic, or API contracts.

Visual validation:

- Verified the fresh built frontend on `http://localhost:3001`.
- Desktop homepage rendered the new premium content with no horizontal overflow.
- Desktop restaurant page rendered the upgraded hero, story, menu, gallery, contact, cart, and AI concierge surfaces with no horizontal overflow.
- Mobile restaurant viewport `390x844` rendered the cinematic hero cleanly with readable headline, clear CTAs, visible trust signals, and no horizontal overflow.
- Mobile menu check found no horizontal overflow and confirmed menu cards rendered.

Validation:

```powershell
cd frontend
pnpm build
```

Result: passed. Next.js compiled successfully and TypeScript passed.

```powershell
cd backend
python -m pytest
```

Result: `19 passed, 59 warnings`.

## French Beginner Developer Guide

Files changed:

- `docs/GUIDE_DEVELOPPEUR_FR.md`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Added a complete French beginner guide for new RestaurantAI collaborators.
- Covered installation, local setup, VS Code usage, project architecture, Docker/local run commands, branch workflow, testing, commits, pushes, Pull Requests, review flow, basic troubleshooting, security rules, daily workflow, and FAQ.
- Clarified that Ayoub reviews Pull Requests manually and Codex reviews them technically before merge.
- Did not modify application code.

## Simplified Collaboration Workflow

Goal:

- Let another developer work normally on feature branches.
- Keep `ai-production-saas-upgrade` protected as the safe working branch.
- Require the repository owner and Codex to validate work before it becomes official.

Files changed:

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_task.md`
- `.github/pull_request_template.md`
- `.github/workflows/ci.yml`
- `CONTRIBUTING.md`
- `docs/GITHUB_WORKFLOW.md`
- `CODEX_HANDOVER_REPORT.md`

Git backup:

- Created backup tag: `backup-before-collaboration`
- Pushed backup tag to GitHub: `origin/backup-before-collaboration`
- Remote verification confirmed the tag exists on GitHub.

Simple workflow:

- `ai-production-saas-upgrade` is the protected working branch.
- No direct pushes to `ai-production-saas-upgrade`.
- Collaborator creates a branch named `feature/task-name`.
- Collaborator edits, commits, pushes, and opens a Pull Request into `ai-production-saas-upgrade`.
- Before merge, the Pull Request must have frontend build passing, backend tests passing, a short explanation, and screenshots only if UI changed.
- Repository owner reviews manually.
- Codex reviews technically.
- Merge only after owner review, Codex review, and passing checks.

GitHub Actions CI:

- Runs on Pull Requests.
- Frontend: `pnpm install`, then `pnpm build`.
- Backend: install Python requirements, then `python -m pytest`.

Manual branch protection still required in GitHub UI:

- Go to `Settings` -> `Branches` -> `Add branch protection rule`.
- Set branch pattern to `ai-production-saas-upgrade`.
- Require Pull Request before merge.
- Require status checks to pass.
- Block force pushes.
- Block branch deletion.

Security rules documented:

- Never share `.env`.
- Never share API keys.
- Collaborator uses `.env.example`.
- No secrets in commits.

Validation:

```powershell
cd frontend
pnpm install
pnpm build
```

Result: passed. Dependencies were already up to date and Next.js compiled successfully.

```powershell
cd backend
python -m pytest
```

Result: `19 passed, 59 warnings`.

## Phase 1.4 - Authentication Hardening Backend Support

Files changed:

- `.env.example`
- `docker-compose.yml`
- `backend/app/api/auth.py`
- `backend/app/core/config.py`
- `backend/app/dependencies.py`
- `backend/tests/test_auth_cookies.py`
- `CODEX_HANDOVER_REPORT.md`

Current authentication architecture:

- Login flow: `POST /api/auth/login` validates email/password against the `User` table and returns the existing `Token` response with `access_token` and `token_type`.
- Logout flow: frontend logout currently removes `restaurant_ai_token` from localStorage and redirects to `/admin/login`; backend now also has `POST /api/auth/logout` to clear the future auth cookie.
- JWT creation: `backend/app/core/security.py` signs JWTs with `sub` set to the user email and `exp` based on `ACCESS_TOKEN_MINUTES`.
- JWT validation: `backend/app/dependencies.py` decodes the JWT, loads the user by email, rejects missing/invalid tokens, and rejects disabled users.
- Frontend auth storage: `frontend/app/admin/login/page.tsx` stores the returned JWT in localStorage under `restaurant_ai_token`; `frontend/lib/auth.ts` reads and clears it.
- Refresh behavior: no refresh-token flow exists; users keep using the same access token until expiry or logout.
- Protected routes: admin API routes use `get_current_user` or `require_super_admin`; public restaurant routes remain unauthenticated.
- Admin dashboard auth: `frontend/components/admin/AdminShell.tsx` requires a localStorage token, calls `/auth/me`, and logs out on failure.
- API dependencies: `frontend/lib/api.ts` sends admin requests with `Authorization: Bearer <token>`.

Migration plan to HttpOnly cookie auth:

1. Backend compatibility phase:
   - Add optional HttpOnly auth cookie support while preserving Bearer JWTs.
   - Keep frontend localStorage behavior unchanged.
   - Validate cookie auth and logout server-side.
2. Dual-read frontend phase:
   - Update frontend requests to include credentials where needed.
   - Keep localStorage token fallback during rollout.
   - Add clear error handling for expired cookie sessions.
3. Cookie-primary phase:
   - Stop writing new tokens to localStorage.
   - Use `/auth/me` with cookie credentials as the admin session source.
   - Keep Bearer support temporarily for rollback and API clients.
4. Cleanup phase:
   - Remove localStorage token dependency from admin UI.
   - Decide whether Bearer auth remains for external integrations.
   - Add CSRF protection if cookie auth is used cross-site or with unsafe methods.

Advantages:

- HttpOnly cookies reduce token exposure from browser JavaScript.
- Server-controlled cookie clearing gives a cleaner logout path.
- The phased rollout avoids breaking existing admin login and API calls.

Risks:

- Cookie auth can introduce CSRF risk if credentials are sent automatically without CSRF controls.
- SameSite and Secure settings must match the deployment topology.
- Cross-origin admin deployments may need CORS credentials configuration in a later phase.

Compatibility:

- Existing Bearer JWT auth still works.
- Existing login response is unchanged.
- Frontend localStorage usage was not modified.
- Cookie setting is disabled by default with `AUTH_COOKIE_ENABLED=false`.

Rollback strategy:

- Leave `AUTH_COOKIE_ENABLED=false` to keep the current Bearer-only behavior.
- If cookie migration causes issues later, disable cookie issuance and keep using Bearer tokens.
- The new logout endpoint only clears the auth cookie and does not invalidate Bearer tokens.

Backend support implemented:

- `POST /api/auth/login` can optionally set an HttpOnly cookie when `AUTH_COOKIE_ENABLED=true`.
- Cookie name, Secure flag, SameSite value, and max age are configurable.
- `get_current_user` continues to prefer Bearer JWTs and falls back to the auth cookie only when cookie auth is enabled.
- `POST /api/auth/logout` clears the configured auth cookie.

Environment variables added:

- `AUTH_COOKIE_ENABLED=false`
- `AUTH_COOKIE_NAME=restaurant_ai_access_token`
- `AUTH_COOKIE_SECURE=false`
- `AUTH_COOKIE_SAMESITE=lax`
- `AUTH_COOKIE_MAX_AGE_SECONDS=43200`

Validation:

```powershell
cd backend
python -m pytest
```

Result: `19 passed, 59 warnings`.

Verification:

- Bearer auth still works for `/auth/me`.
- Cookie auth works when `AUTH_COOKIE_ENABLED=true`.
- Logout clears the configured auth cookie.
- Existing frontend remains compatible because the login response is unchanged and cookie setting is disabled by default.
- Bearer auth takes priority over an invalid auth cookie.

Final review before commit:

- `AUTH_COOKIE_ENABLED` defaults to `false` in backend settings, `.env.example`, and Docker Compose.
- Existing Bearer token auth still works through the same `Authorization: Bearer <token>` flow.
- Cookie auth is additive only and is read only when cookie auth is explicitly enabled.
- The Secure cookie flag can be enabled for production with `AUTH_COOKIE_SECURE=true`.
- SameSite is configurable with `AUTH_COOKIE_SAMESITE`.
- Logout clears the auth cookie using the configured cookie name, path, Secure flag, HttpOnly flag, and SameSite value.
- Tests cover token-only login, Bearer `/auth/me`, enabled cookie `/auth/me`, cookie logout clearing, and Bearer precedence over an invalid cookie.
- No frontend files changed.
- localStorage token storage and removal remain in place.

Final review validation:

```powershell
cd backend
python -m pytest
```

Result: `19 passed, 59 warnings`.

Next migration phase:

- Update frontend requests to support cookie credentials while keeping Bearer fallback.
- Add CSRF strategy before making cookie auth the primary browser authentication mechanism.
- Do not remove localStorage token behavior until the dual-read phase has been validated.

## Phase 1.3 - Backend Rate Limiting

Files changed:

- `.env.example`
- `docker-compose.yml`
- `backend/app/api/public.py`
- `backend/app/core/config.py`
- `backend/app/core/rate_limit.py`
- `backend/tests/test_rate_limit.py`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Added IP-based rate limiting for public endpoints only.
- Added configurable demo-friendly per-minute limits.
- Added friendly HTTP 429 JSON responses with `Retry-After` headers.
- Added warning logs when a rate limit is exceeded.
- Added optional trusted proxy header support through explicit env configuration.
- Left frontend, auth, admin APIs, database schema, and API response contracts unchanged.

Protected endpoints:

- Chat: `POST /api/restaurants/{slug}/chat`, `POST /api/chat`.
- Reservations: `POST /api/restaurants/{slug}/reservations`, `POST /api/contact`.
- Orders: `POST /api/restaurants/{slug}/orders`.
- General public API: `GET /api/restaurant`, `GET /api/restaurants/{slug}`, `GET /api/restaurants/{slug}/orders/{public_id}`.

Environment variables added:

- `RATE_LIMIT_CHAT_PER_MINUTE=10`
- `RATE_LIMIT_RESERVATIONS_PER_MINUTE=5`
- `RATE_LIMIT_ORDERS_PER_MINUTE=10`
- `RATE_LIMIT_PUBLIC_PER_MINUTE=100`
- `TRUST_PROXY_HEADERS=false`

Validation:

```powershell
cd backend
python -m pytest
```

Result: `14 passed, 41 warnings`.

Manual verification:

- Normal chat, order, and reservation requests returned successful JSON.
- Repeated reservation spam returned HTTP 429.
- 429 body was friendly JSON:
  - `Too many requests. Please wait a moment and try again.`
  - `retry_after_seconds`
- `Retry-After` header was present.
- A rate-limit warning log was emitted.

Review verification:

- Rate-limit buckets are keyed by both category rule name and client IP, so limits are per endpoint category and per IP, not global for all users.
- Chat, reservation, order, and general public endpoints use separate rule names: `public_chat`, `public_reservations`, `public_orders`, and `public_general`.
- With `TRUST_PROXY_HEADERS=false`, spoofable `X-Forwarded-For` and `X-Real-IP` headers are ignored and the direct client host is used.
- Trusted proxy headers remain disabled by default in application settings, `.env.example`, and Docker defaults.
- Test isolation is protected by resetting the in-memory limiter with an autouse pytest fixture.
- HTTP 429 responses include a friendly JSON body and a `Retry-After` header.
- Normal requests are allowed up to the configured limit; verification confirmed one exhausted category does not block another category.
- Docker env values are optional because `docker-compose.yml` provides demo-friendly defaults with `${VAR:-default}`.

Review validation:

```powershell
cd backend
python -m pytest
```

Result: `14 passed, 41 warnings`.

## Public Order Endpoint Repair

Files changed:

- `backend/app/api/public.py`
- `backend/tests/test_tenant_safety.py`
- `CODEX_HANDOVER_REPORT.md`

Root cause:

- `create_order()` started correctly but stopped after loading menu items.
- The order creation, item creation, delivery address creation, commit, and response reload logic had been placed after `return order` inside `order_tracking()`.
- Execution therefore stopped at the end of `create_order()` without returning an order, while the remaining implementation was unreachable after the tracking endpoint's unconditional return.
- This was a return/logic placement issue, not a routing, dependency, authentication, or schema issue.

Repair summary:

- Moved the existing order creation implementation back into `create_order()`.
- Left `order_tracking()` as a pure lookup endpoint.
- Preserved the existing API route, request schema, response model, validation rules, public authentication behavior, order total calculation, delivery fee behavior, status history creation, and delivery address handling.
- Added focused backend regression coverage for public order creation.

Validation:

```powershell
cd backend
python -m pytest
```

Result: `9 passed, 37 warnings`.

Manual verification:

- Direct in-memory endpoint verification created a pickup order, stored it, returned a public id, total `37.50`, one order item, and `NEW` status history.
- Frontend manual verification used the real repaired `public.create_order()` function through a temporary local HTTP shim.
- The customer flow loaded Bella Napoli, added Margherita, submitted an order, displayed the order success state, and the backend shim database showed `{"orders": 1}`.

## Phase 1.1 - Dynamic Restaurant SEO

Files changed:

- `.env.example`
- `docker-compose.yml`
- `frontend/app/restaurants/[slug]/page.tsx`
- `frontend/app/restaurants/[slug]/RestaurantWebsiteClient.tsx`
- `frontend/Dockerfile`
- `frontend/components/RestaurantSite.tsx`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Added route-level dynamic metadata for public restaurant pages only.
- Kept global/admin metadata under the existing RestaurantAI branding.
- Moved the existing client-side restaurant page loading into a colocated client component so the route file can export `generateMetadata`.
- Added safe fallback metadata for missing or unfetchable restaurants.
- Added Restaurant JSON-LD schema using only existing restaurant fields.
- Added `NEXT_PUBLIC_SITE_URL` as the public frontend URL used for production canonical and Open Graph URLs.
- Removed backend/CORS-oriented `FRONTEND_URL` from SEO URL generation so production metadata does not accidentally emit localhost canonicals.

SEO improvements:

- Dynamic title and description based on restaurant name, city, description, theme/category context, and safe fallbacks.
- Dynamic keywords for restaurant name, city, theme/category context, menu, reservations, ordering, and AI maitre d'.
- Canonical URL for `/restaurants/[slug]`.
- Open Graph title, description, URL, site name, and image.
- Canonical and Open Graph URLs use `NEXT_PUBLIC_SITE_URL` when configured; `http://localhost:3000` is only used as a development fallback.
- Twitter summary/large-image card metadata.
- Robots metadata: published restaurants can be indexed; missing/unavailable restaurant metadata uses `noindex, nofollow`.
- Restaurant schema includes name, description, URL, image, logo, phone, email, address, social links, opening hours text, menu anchor, and reservation support when present.

Validation:

```powershell
cd frontend
pnpm build
```

Result: passed. Next.js compiled successfully, TypeScript passed, and `/restaurants/[slug]` remains a dynamic route.

## Phase 1.2 - Cart Persistence

Files changed:

- `frontend/components/RestaurantSite.tsx`
- `frontend/lib/cartStorage.ts`
- `CODEX_HANDOVER_REPORT.md`

Implementation summary:

- Added reusable cart localStorage helpers.
- Persisted cart data per restaurant using a versioned key.
- Restored cart state after client hydration only, avoiding server/client markup mismatch.
- Stored only menu item IDs and quantities, then rebuilt cart lines from current restaurant menu data.
- Handled corrupted JSON safely by clearing the broken storage entry.
- Ignored old storage versions through the versioned key and payload version.
- Cleared both React cart state and the persisted cart after a successful order.
- Kept backend, routing, auth, tests, and visible UI behavior unchanged.

Storage key format:

```text
restaurantai.cart.{restaurant-slug-or-id}.v1
```

Example:

```text
restaurantai.cart.bella-napoli.v1
```

Validation:

```powershell
cd frontend
pnpm build
```

Result: passed. Next.js compiled successfully and TypeScript passed.

Manual validation:

- Opened Bella Napoli with a temporary local mock API.
- Added 3 menu items.
- Refreshed the restaurant page.
- Cart restored with the 3 selected items.
- Submitted an order against the temporary mock API.
- Cart became empty.
- Refreshed again.
- Cart stayed empty.

Review verification:

- Cart persistence is wired into the existing `submitOrder()` flow used by the public restaurant page.
- The cart is cleared only after `request<RestaurantOrder>(...)` returns a successful order response.
- If order submission fails and the request throws, the catch branch leaves both React cart state and persisted localStorage cart untouched.
- Corrupted localStorage JSON is caught safely and the invalid storage entry is removed.
- Hydration mismatch is avoided because localStorage is read only inside `useEffect`; the initial render keeps the cart empty until client hydration completes.
- The real backend success path cannot be end-to-end verified yet because the known `backend/app/api/public.py` public order creation issue remains intentionally out of scope for Task 1.2.

## Current Architecture Summary

RestaurantAI is a two-service SaaS-style application with a Next.js frontend, a FastAPI backend, PostgreSQL/pgvector persistence, and Docker Compose for local full-stack execution.

### Frontend

- Location: `frontend/`
- Framework: Next.js 16 app router, React 19, TypeScript strict mode, Tailwind CSS.
- Primary app folders:
  - `frontend/app/` contains public routes, admin routes, and dynamic restaurant/order pages.
  - `frontend/components/` contains public restaurant UI, shell/header/footer/chat, and admin dashboards/editors.
  - `frontend/lib/` contains shared API, auth, and type helpers.
- API access:
  - `frontend/lib/api.ts` sends requests to same-origin `/api`.
  - `frontend/next.config.ts` rewrites `/api/:path*` and `/uploads/:path*` to `BACKEND_INTERNAL_URL`, defaulting to `http://localhost:8000`.
- Authentication storage:
  - Admin bearer token is stored in browser `localStorage` under `restaurant_ai_token`.

### Backend

- Location: `backend/`
- Framework: FastAPI with SQLAlchemy ORM.
- Entry point: `backend/app/main.py`.
- Main modules:
  - `app/api/auth.py`: login and current-user endpoint.
  - `app/api/admin.py`: authenticated admin, restaurant, menu, upload, reservation, order, driver, and dashboard endpoints.
  - `app/api/public.py`: public restaurant, reservation, chat, order, and order tracking endpoints.
  - `app/core/config.py`: Pydantic settings loaded from environment or `backend/.env`.
  - `app/core/database.py`: SQLAlchemy engine/session setup.
  - `app/core/security.py`: bcrypt password hashing and JWT creation/decoding.
  - `app/services/knowledge.py`: upload text extraction, chunking, embeddings, and structured knowledge rebuilding.
  - `app/services/chat.py`: restaurant-scoped RAG retrieval and OpenAI chat responses.
  - `app/services/seed.py`: demo themes, users, restaurant, menu, images, and knowledge seeding.
  - `app/services/migrations.py`: idempotent SQL bridge for MVP schema changes.

### Database

- Docker database image: `pgvector/pgvector:pg16`.
- ORM models: `backend/app/models.py`.
- Data model includes users, themes, restaurants, images, menu categories/items, knowledge documents/chunks, conversations/messages, contact requests, orders, order items, status history, delivery addresses, drivers, and delivery assignments.
- Vector search uses `pgvector.sqlalchemy.Vector(1536)` for knowledge embeddings.
- Startup behavior:
  - Creates `vector` extension.
  - Calls `Base.metadata.create_all`.
  - Runs an idempotent migration bridge.
  - Seeds demo data.
- Warning: there is no formal migration system such as Alembic yet.

### Docker

- Root: `docker-compose.yml`.
- Services:
  - `db`: PostgreSQL 16 with pgvector, persistent `postgres_data` volume.
  - `backend`: builds `backend/Dockerfile`, exposes `8000`, mounts `uploads` volume.
  - `frontend`: builds `frontend/Dockerfile`, exposes `3000`, uses Next standalone output.
- Backend Docker image targets Python 3.12.
- Frontend Docker image uses Node 22 Alpine.
- Warning: `frontend/Dockerfile` uses `npm install`/`npm run build`, while the repo has `pnpm-lock.yaml` and the requested local workflow uses `pnpm`.

### Authentication

- Login route: `POST /api/auth/login`.
- Current user route: `GET /api/auth/me`.
- Auth mechanism: JWT bearer token signed with `JWT_SECRET`.
- Role model:
  - `SUPER_ADMIN`
  - `RESTAURANT_OWNER`
- Admin authorization is enforced in backend dependencies and route helpers.
- Frontend persists tokens in `localStorage`.
- Production warning: localStorage bearer tokens are convenient for MVP work but weaker than hardened HTTP-only cookie/session flows.

### AI Integration

- OpenAI dependency: `openai==1.82.0`.
- Chat model setting: `OPENAI_CHAT_MODEL`, default `gpt-4.1-mini`.
- Embedding model setting: `OPENAI_EMBEDDING_MODEL`, default `text-embedding-3-small`.
- If `OPENAI_API_KEY` is missing:
  - Embedding creation returns `None` embeddings.
  - Chat endpoint returns a configured fallback telling the user AI is not configured.
  - Retrieval can fall back to token-overlap matching for local development.
- Knowledge sources:
  - Restaurant profile/opening hours/menu structured facts.
  - Uploaded PDF/TXT documents.

### Uploads

- Upload directory setting: `upload_dir`, default `uploads`.
- Static serving: backend mounts `/uploads`.
- Frontend proxy: `/uploads/:path*` rewrites to backend.
- Image uploads:
  - Endpoint family: `/api/admin/restaurants/{restaurant_id}/images`.
  - Accepted types: JPEG, PNG, WEBP, GIF.
  - Max size: 8 MB.
  - Stored under `uploads/{restaurant_id}/`.
- Knowledge document uploads:
  - Endpoint family: `/api/admin/restaurants/{restaurant_id}/documents`.
  - Accepted content by filename: PDF and TXT.
  - Max size: 10 MB.
  - Stored under `uploads/{restaurant_id}/documents/`.

### Routing

- Public frontend routes:
  - `/`
  - `/menu`
  - `/contact`
  - `/restaurants/[slug]`
  - `/restaurants/[slug]/orders/[publicId]`
- Admin frontend routes:
  - `/admin`
  - `/admin/login`
  - `/admin/dashboard`
  - `/admin/users`
  - `/admin/restaurants`
  - `/admin/restaurants/new`
  - `/admin/restaurants/[id]/edit`
  - `/admin/restaurants/[id]/design`
  - `/admin/restaurants/[id]/images`
  - `/admin/restaurants/[id]/menu`
  - `/admin/restaurants/[id]/chatbot`
  - `/admin/restaurants/[id]/customers`
  - `/admin/restaurants/[id]/orders`
  - `/admin/restaurants/[id]/reservations`
- Backend route prefixes:
  - Auth routes are included under `/api/auth`.
  - Admin routes are included under `/api/admin`.
  - Public routes are included under `/api`.

## Build Status

### Frontend

Commands run from `frontend/`:

```powershell
pnpm install
pnpm build
```

Result: passed.

Notes:

- `pnpm install` reported `Already up to date`.
- `pnpm build` completed successfully with Next.js 16.2.9.
- TypeScript completed successfully during `next build`.
- Static/dynamic route generation completed successfully.

### Backend

Dependency/test-environment work:

- Confirmed `pytest==8.3.5` is declared in `backend/requirements.txt`.
- Updated `psycopg[binary]` from `3.2.9` to `3.2.13` so `python -m pip install -r requirements.txt` can install on the local Python 3.14 runtime.
- Added `backend/tests/conftest.py` to provide test-only defaults for required settings before app modules import.

Command run from `backend/`:

```powershell
python -m pytest
```

Result: passed.

Local environment notes:

- Local `python --version` is Python 3.14.5.
- `py -0p` only listed Python 3.14 runtimes.
- Backend Dockerfile targets Python 3.12.
- Full backend requirements now install successfully in the active local Python environment after the patch-level `psycopg` bump.
- `python -m pytest` collected 8 tests and passed all 8.
- Warnings: 37 FastAPI/Python 3.14 deprecation warnings from `asyncio.iscoroutinefunction`.

Additional static check run from `backend/`:

```powershell
python -m compileall app tests
```

Result: passed. Python files compile syntactically.

## Test Status

- Backend tests exist:
  - `backend/tests/test_knowledge.py`
  - `backend/tests/test_tenant_safety.py`
- Backend tests pass locally: `8 passed, 37 warnings`.
- No frontend test suite is configured in `frontend/package.json`.

## Environment Variables

No local `.env` file was found at:

- project root `.env`
- `backend/.env`

The root `.env.example` documents the expected variables:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DEMO_OWNER_EMAIL`
- `DEMO_OWNER_PASSWORD`
- `FRONTEND_URL`
- `NEXT_PUBLIC_SITE_URL`
- `BACKEND_INTERNAL_URL`

Important distinction:

- Docker Compose provides local defaults for required backend variables.
- Running backend imports/tests directly outside Docker requires required settings such as `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`, and `DEMO_OWNER_PASSWORD` to be available, unless a test harness overrides settings earlier.

## Immediate Warnings And Technical Debt

### High Priority

1. Public order creation appears broken in `backend/app/api/public.py`.
   - The `create_order` route begins at line 132 but does not finish creating or returning an order before the next route declaration.
   - The order creation logic appears after a `return` inside `order_tracking`, making it unreachable.
   - Frontend ordering calls `POST /restaurants/{slug}/orders`, so this is likely a user-facing runtime failure even though TypeScript build passes.

2. Formal database migrations are missing.
   - Startup currently mixes `Base.metadata.create_all` with an idempotent SQL bridge.
   - This is risky for production SaaS evolution.

### Medium Priority

1. Frontend package manager mismatch in Docker.
   - Local workflow and lockfile use pnpm.
   - `frontend/Dockerfile` uses npm and copies `package*.json`, ignoring `pnpm-lock.yaml`.

2. Authentication is MVP-grade.
   - Bearer tokens are stored in `localStorage`.
   - No refresh-token flow, password reset, rate limiting, audit logging, MFA, or session revocation was found.

3. Upload storage is local filesystem/volume based.
   - Suitable for local demo.
   - Production SaaS should use object storage, content scanning, stricter filename/content validation, and retention policies.

4. AI calls are synchronous from request handlers.
   - OpenAI chat/embedding calls happen in request flow.
   - Production should consider background jobs, timeouts, retries, observability, and cost controls.

5. Demo/default credentials exist in Docker Compose and README.
   - Acceptable for local demo.
   - Must not be used in any real deployment.

### Low Priority

1. No TODO/FIXME comments were found by `rg`.

2. Generated/cache folders exist locally:
   - `frontend/.next`
   - `frontend/node_modules`
   - backend `__pycache__` folders
   These appear to be ignored/generated workspace artifacts, not source folders.

3. Conventional duplicate basenames exist:
   - `Dockerfile` in frontend and backend.
   - `.dockerignore` in frontend and backend.
   - many `page.tsx` files due Next.js routing.
   These are expected, not necessarily a problem.

## Check Results

- Git status before report update: clean working tree on branch `ai-production-saas-upgrade`.
- Broken TypeScript imports: none found by `pnpm build`.
- TypeScript errors: none found by `pnpm build`.
- Python syntax errors: none found by `python -m compileall app tests`.
- Backend pytest: `8 passed, 37 warnings`.
- Python runtime test warnings: FastAPI emits Python 3.14 deprecation warnings for `asyncio.iscoroutinefunction`.
- TODO/FIXME comments: none found.
- Duplicate files: only conventional duplicate basenames were observed.
- Unused folders: no clearly unused source folders identified. Generated folders are present locally.

## Recommendations

1. First approval item: fix the broken public order creation route and add a regression test for `POST /api/restaurants/{slug}/orders`.

2. Standardize backend local testing:
   - Use Python 3.12, matching Docker.
   - Create a `.venv`.
   - Install `backend/requirements.txt`.
   - Run `python -m pytest`.

3. Add Alembic before further schema work.

4. Align frontend Docker build with pnpm and `pnpm-lock.yaml`.

5. Introduce production auth hardening before launch:
   - HTTP-only cookies or a stronger token strategy.
   - rate limiting.
   - password reset.
   - audit logs.
   - secret rotation path.

6. Move uploads to object storage before multi-tenant production use.

7. Add CI checks:
   - frontend `pnpm install --frozen-lockfile` and `pnpm build`.
   - backend Python 3.12 dependency install and `python -m pytest`.
   - optional Python lint/type checks once selected.

## Files Changed By This Baseline Pass

- `CODEX_HANDOVER_REPORT.md`
- `backend/requirements.txt`
- `backend/tests/conftest.py`

No application source behavior was changed.
