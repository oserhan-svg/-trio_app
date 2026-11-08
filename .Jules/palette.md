## 2024-03-24 - Accessibility gaps in the main AppShell header
**Learning:** Found multiple accessibility gaps in the core `AppShell.jsx` component that forms the main layout. Missing `aria-label`s on icon-only buttons (menu toggle, theme toggle, notifications, logout), missing `aria-expanded` on the menu toggle, and missing `aria-hidden="true"` on decorative icons inside buttons and inputs.
**Action:** Always verify accessibility attributes (`aria-label`, `aria-expanded`, `aria-hidden`) on layout components that use icon-only interactive elements, as they are used on every single page view.
