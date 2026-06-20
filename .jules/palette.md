## 2024-06-20 - Improve AppShell Accessibility
**Learning:** Topbar actions (menu, notifications, search) were lacking focus states (`focus-visible`) and clear labeling, which significantly hinders keyboard-only users. Applying `focus-within` to search wrappers and `focus-visible` to icon buttons resolves this seamlessly within Tailwind constraints without altering visual styling for mouse users.
**Action:** Always ensure icon-only buttons have `aria-label`s and interactive elements implement `focus-visible` to satisfy both screen reader and keyboard navigation requirements.
