## 2024-06-23 - Added Accessibility to AppShell Topbar Buttons
**Learning:** Icon-only buttons in the main navigation shell lack accessibility attributes and keyboard focus states, making them difficult to use for screen reader and keyboard-only users.
**Action:** Always include `aria-label` and visual focus indicators (`focus-visible` classes) on interactive icon-only elements.
