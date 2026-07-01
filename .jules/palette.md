## 2024-07-02 - AppShell Topbar Accessibility
**Learning:** AppShell's icon-only buttons (Menu, Theme, Notifications) and search input lacked ARIA labels and visible focus states, making keyboard navigation difficult and screen readers unable to interpret them.
**Action:** Always add `aria-label` to icon-only buttons and `focus-visible` / `focus-within` utility classes to interactive elements to ensure accessibility for all users.
