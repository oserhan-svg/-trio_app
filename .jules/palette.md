## 2025-02-12 - Icon-Only Discoverability
**Learning:** In a heavily data-dense application like this real-estate tracker, icon-only navigation elements (like notification bells or layout toggles) can be ambiguous. Simply adding aria-label satisfies screen readers, but sighted users still struggle without explicit tooltips (title attributes).
**Action:** Combine aria-label with title attributes (localized, e.g., "Menüyü aç/kapat", "Bildirimler") on all icon-only interactive elements to simultaneously satisfy accessibility and visual discoverability for all user types.
