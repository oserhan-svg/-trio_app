## 2024-05-18 - Improve accessibility for icon-only navigation buttons in carousels
**Learning:** Icon-only navigation buttons in `OpportunityCarousel.jsx` lack accessible names and keyboard focus indicators.
**Action:** Added `aria-label` attributes to clarify button purpose for screen readers and used `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500` utility classes for distinct, brand-aligned keyboard focus styling.
