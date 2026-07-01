# Fix Later — Backlog

---

## Next.js Security Vulnerability Upgrade

- **Status:** Not started
- **Reason:** Current Next.js 14.2.18 has a known security vulnerability (flagged by npm install)
- **Action:** Upgrade to a patched version after MVP development is complete
- **Ref:** https://nextjs.org/blog/security-update-2025-12-11

Check items in order and remove when resolved.

---

## Landing Page (`/`)

- **Status:** Not started
- **Reason:** Planned after Feature 2 (wishlist management + dashboard) is complete
- **Action:**
  - Service introduction page for non-authenticated visitors
  - Should be accessible after login as well (separate from dashboard)
  - Include Google login button
- **Prerequisite:** Feature 2 dashboard complete

---

## Price Parsing Improvement

- **Status:** Not started
- **Reason:** Microlink API does not reliably extract price from most e-commerce sites (Amazon, Best Buy, Walmart, etc.) — these sites don't expose price via og:price or JSON-LD metadata. Price field is left empty and filled in manually by the user.
- **Action:** Investigate a dedicated product data API or structured data extraction approach for more reliable price parsing
- **Known limitation:** Sites with antibot protection (Cloudflare etc. — e.g. Osprey, many large retailers) return `EPROXYNEEDED` from Microlink free tier. Microlink PRO plan has residential proxies to bypass this.
- **Prerequisite:** None — low priority, current UX (manual entry fallback) is acceptable

---

## Quantity Reduction Conflict with Existing Reservations

- **Status:** Not started
- **Reason:** When an owner reduces an item's quantity below the current active reservation count, the edit is saved silently — no validation or warning is shown. This can create an oversold state (more reservations than available slots).
- **Action:** Before saving, check if `new_quantity < active_reservation_count`. If so, block the save and show an error: e.g. "Can't reduce quantity — X people have already reserved this item."
- **Where:** `components/wishlist/wish-item-form.tsx` (client-side check) + optionally enforce server-side in `wish_items` update logic
- **Prerequisite:** None

---

## Guest Reservation — No Visual Feedback After Reserving (Multi-slot Items)

- **Status:** Not started
- **Reason:** After a guest successfully reserves an item that has multiple slots, the button state does not change to reflect their reservation. The slot count decreases (optimistic update), but the button still shows "🎁 I'll Get This!" instead of indicating the guest already reserved. This is confusing when multiple slots are available and a guest might accidentally reserve twice.
- **Action:** After a successful guest reservation, store the reserved item ID (or a flag) in `sessionStorage`. On mount, `ShareItemList` reads from `sessionStorage` to restore the "I'm getting this!" state for the current session. Guest-side cancel would also need a token-based flow since we don't have a `reservationId` on the client for guests.
- **Where:** `components/wishlist/share-item-list.tsx`, `components/wishlist/reservation-modal.tsx`
- **Prerequisite:** None — low priority for single-slot items; becomes confusing with quantity > 1

---

## Extract event_type Data into a Single File

- **Status:** Not started
- **Reason:** `EVENT_TYPES` (form) and `EVENT_EMOJI` (card display) are currently duplicated across two files
  - `components/wishlist/wishlist-form.tsx`
  - `components/wishlist/wishlist-card.tsx`
- **Action:** Extract into a single source file (e.g. `lib/constants/event-types.ts`)
- **Prerequisite:** None — handle during a future refactor pass
