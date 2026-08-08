## 2025-02-14 - Icon-Only Button Accessibility in Turkish UI
**Learning:** Icon-only buttons (like 'X' or Trash icons) used in dynamic elements like active filters and saved searches lack screen reader accessibility. It's critical to add aria-labels localized to the application's language (Turkish).
**Action:** Always verify that every icon-only interactive element has an `aria-label` and/or `title` prop localized to the current UI language (e.g., 'Filtreyi kaldır' instead of 'Remove filter') to maintain a11y standards.
