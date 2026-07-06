# Fix Later — Backlog

---

## Next.js Security Vulnerability Upgrade

- **Status:** Not started
- **Reason:** Current Next.js 14.2.18 has a known security vulnerability (flagged by npm install)
- **Action:** Upgrade to a patched version after MVP development is complete
- **Ref:** https://nextjs.org/blog/security-update-2025-12-11

Check items in order and remove when resolved.

---

## Price Parsing Improvement

- **Status:** Not started
- **Reason:** Microlink API does not reliably extract price from most e-commerce sites (Amazon, Best Buy, Walmart, etc.) — these sites don't expose price via og:price or JSON-LD metadata. Price field is left empty and filled in manually by the user.
- **Action:** Investigate a dedicated product data API or structured data extraction approach for more reliable price parsing
- **Known limitation:** Sites with antibot protection (Cloudflare etc. — e.g. Osprey, many large retailers) return `EPROXYNEEDED` from Microlink free tier. Microlink PRO plan has residential proxies to bypass this.
- **Prerequisite:** None — low priority, current UX (manual entry fallback) is acceptable

---

