## 2024-04-11 - Add ARIA Labels and Focus Rings to AppShell Topbar
**Learning:** Found that the topbar (header) icon-only buttons (`Menu`, `Theme Toggle`, `Notifications`) in `AppShell.jsx` lacked screen reader context (`aria-label`) and prominent keyboard focus indicators (`focus-visible`).
**Action:** Next time, ensure all icon-only buttons include descriptive `aria-label`s and clear visual focus styles using `focus-visible` utility classes for robust keyboard and screen-reader accessibility.
