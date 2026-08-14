## 2024-08-14 - Icon-only buttons lacking ARIA labels
**Learning:** Found several icon-only buttons in the core AppShell layout (Menu, Theme Toggle, Notifications, Logout) that either lack accessible names or rely only on `title` attributes (which are insufficient for screen readers).
**Action:** Always add `aria-label` to icon-only buttons, especially in global navigation components.
