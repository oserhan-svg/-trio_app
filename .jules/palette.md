## 2024-03-17 - Added aria-labels to FilterBar
**Learning:** Icon-only buttons in `FilterBar` (e.g., delete saved search, clear all filters, remove filter chip) were missing descriptive labels, making them inaccessible to screen readers.
**Action:** When creating or modifying icon-only buttons, always ensure they have an `aria-label` attribute describing their function in the appropriate language (e.g., Turkish for this repo: `aria-label="Filtreleri Sıfırla"`).
