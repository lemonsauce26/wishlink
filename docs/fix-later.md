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

## Invite Re-invite Policy Decisions Needed

- **Status:** Not started
- **Reason:** No policy defined for re-inviting a user whose invite was previously cancelled. Currently, a new record is inserted whenever a cancelled record exists (via `neq('status', 'cancelled')` check), which can result in duplicate rows for the same email.
- **Cases to decide:**
  1. Re-inviting a revoked user (accepted → cancelled): reuse existing record (update status back to pending) vs. insert a new record (preserve history)
  2. Re-inviting a cancelled pending user (pending → cancelled): same question — reuse vs. new record
- **Action:** Decide on policy for each case, then update `POST /api/inner-circle/invite` accordingly
- **Prerequisite:** Decide before email sending is implemented

---

## Extract event_type Data into a Single File

- **Status:** Not started
- **Reason:** `EVENT_TYPES` (form) and `EVENT_EMOJI` (card display) are currently duplicated across two files
  - `components/wishlist/wishlist-form.tsx`
  - `components/wishlist/wishlist-card.tsx`
- **Action:** Extract into a single source file (e.g. `lib/constants/event-types.ts`)
- **Prerequisite:** None — handle during a future refactor pass
