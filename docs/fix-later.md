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

## Reservation Cancellation Email — No Distinction Between Self-Cancel and Owner-Forced Cancel

- **Status:** Not started
- **Reason:** When a reserver cancels their own reservation, and when the owner force-cancels it, the same `sendReservationCancelledEmail` is sent to the reserver. There's no way for the reserver to know whether they cancelled themselves or the owner removed them.
- **Action:** Add a `cancelledBy: "self" | "owner"` param to `sendReservationCancelledEmail` and send different email copy per case. e.g. self-cancel → "Your reservation has been cancelled.", owner-cancel → "The wishlist owner has removed your reservation."
- **Where:** `lib/email.ts` (email copy), `app/api/reservations/[reservationId]/route.ts` (determine who cancelled based on `user.id` vs `reservation.user_id`), `app/reservations/cancel/[cancelToken]/page.tsx` (always self-cancel, pass `"self"`)
- **Prerequisite:** None

---

## Extract event_type Data into a Single File

- **Status:** Not started
- **Reason:** `EVENT_TYPES` (form) and `EVENT_EMOJI` (card display) are currently duplicated across two files
  - `components/wishlist/wishlist-form.tsx`
  - `components/wishlist/wishlist-card.tsx`
- **Action:** Extract into a single source file (e.g. `lib/constants/event-types.ts`)
- **Prerequisite:** None — handle during a future refactor pass
