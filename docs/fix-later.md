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

## Extract event_type Data into a Single File

- **Status:** Not started
- **Reason:** `EVENT_TYPES` (form) and `EVENT_EMOJI` (card display) are currently duplicated across two files
  - `components/wishlist/wishlist-form.tsx`
  - `components/wishlist/wishlist-card.tsx`
- **Action:** Extract into a single source file (e.g. `lib/constants/event-types.ts`)
- **Prerequisite:** None — handle during a future refactor pass
