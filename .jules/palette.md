## 2024-05-13 - Improve AppShell Navigation Accessibility
**Learning:** Found multiple instances where critical navigation buttons (sidebar, topbar, mobile bottom nav) in the main layout (AppShell) lacked proper aria attributes (like `aria-current` for active state, and `aria-label` for icon-only buttons) and keyboard focus states.
**Action:** Always ensure that interactive elements have visual focus indicators (`focus-visible:ring-2`) and proper semantic markup for screen readers to provide context about the current page and button purposes.
