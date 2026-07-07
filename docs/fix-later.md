# Fix Later — Backlog

---

## Next.js Security Vulnerability Upgrade

- **Status:** Not started
- **Reason:** Current Next.js 14.2.18 has a known security vulnerability (flagged by npm install)
- **Action:** Upgrade to a patched version after MVP development is complete
- **Ref:** https://nextjs.org/blog/security-update-2025-12-11

Check items in order and remove when resolved.

---

## Reservation Visibility Option Change Behavior

- **Status:** Not started
- **Reason:** When the owner changes `reservation_visibility` from `Surprise Me` to `Show Me Who Cares` or `Verified Only`, the behavior for existing reservations is undefined — previously hidden reservations would suddenly become visible to the owner.
- **Action:** Decide and implement how to handle this transition (e.g., warn the owner before saving, clear existing reservations, or grandfather in existing data)
- **Prerequisite:** Product decision needed on intended behavior

---

## Price Parsing Improvement

- **Status:** Not started
- **Reason:** Microlink API fails to reliably extract price and product info from sites with antibot protection (Amazon, Best Buy, etc.). A more capable API with antibot bypass support is needed, but most options are paid services.
- **Action:** Before adopting a paid service, evaluate replacing Microlink with a more capable API that supports antibot bypass
- **Known limitation:** Sites with antibot protection (Cloudflare, etc.) return `EPROXYNEEDED` from Microlink free tier. No reliable free alternative exists to bypass this.
- **Prerequisite:** Decision needed on whether to use a paid API — current UX (manual entry fallback) is acceptable for now

---

