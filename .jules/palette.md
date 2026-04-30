## 2025-02-20 - Topbar Accessibility Enhancement
**Learning:** Icon-only buttons in the main navigation bar (`AppShell.jsx`) lacked proper ARIA labels and distinct keyboard focus indicators (`focus-visible`). The application uses Turkish for localization, so accessibility enhancements must also be localized to match the surrounding text context.
**Action:** When adding utility or action buttons that rely solely on icons (e.g., Lucide React icons), always ensure they have an `aria-label` in the appropriate language and include `focus-visible` utility classes to support keyboard navigation.
