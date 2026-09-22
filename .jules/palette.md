## 2024-05-24 - Missing ARIA Labels on Close Buttons
**Learning:** Found that generic icon-only close buttons (like the `X` icon in `PropertyDetailModal.jsx`) lack `aria-label` attributes, which creates an accessibility gap for screen reader users trying to dismiss modals or items. This seems to be a recurring pattern.
**Action:** Adding `aria-label="Kapat"` to the modal close button to provide clear context.
