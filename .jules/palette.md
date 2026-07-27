## 2024-07-27 - Icon-only buttons missing aria-labels
**Learning:** Found multiple icon-only buttons in `PropertyDetailModal.jsx` and `FilterBar.jsx` (e.g., closing modals, removing saved searches, clearing individual filters) that rely solely on `X` or `Trash2` icons from `lucide-react` without any `aria-label` or `title` attributes for screen readers.
**Action:** Always add descriptive, Turkish `aria-label` (e.g., "Kapat", "Aramayı Sil", "Filtreyi Kaldır") and/or `title` attributes to icon-only buttons to ensure they are accessible to all users.
