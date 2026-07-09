# Fix Later — Backlog

---

## Reservation Visibility Option Change Behavior

- **Status:** Decision made — not yet implemented
- **Reason:** When the owner changes `reservation_visibility` from `Surprise Me` to `Show Me Who Cares` or `Verified Only`, reservers who reserved expecting anonymity could be suddenly exposed without their consent.
- **Decision (Option A):** Store the visibility state at reservation time via a `was_anonymous` boolean column on `wishitem_reservations`. Even if the owner changes the wishlist setting later, reservations made under `Surprise Me` remain hidden permanently. New reservations follow the updated setting.
- **Action:** Add `was_anonymous` column to `wishitem_reservations` table (Supabase migration). Update reservation creation logic to set this flag. Update reservation display logic to respect `was_anonymous` over current wishlist setting.
- **Prerequisite:** Supabase schema migration required

---

## Price Parsing Improvement

- **Status:** Not started
- **Reason:** Microlink API fails to reliably extract price and product info from sites with antibot protection (Amazon, Best Buy, etc.). A more capable API with antibot bypass support is needed, but most options are paid services.
- **Action:** Before adopting a paid service, evaluate replacing Microlink with a more capable API that supports antibot bypass
- **Known limitation:** Sites with antibot protection (Cloudflare, etc.) return `EPROXYNEEDED` from Microlink free tier. No reliable free alternative exists to bypass this.
- **Prerequisite:** Decision needed on whether to use a paid API — current UX (manual entry fallback) is acceptable for now

---

