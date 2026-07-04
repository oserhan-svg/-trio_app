## 2024-07-04 - ARIA labels in AppShell buttons
**Learning:** Icon-only buttons in `AppShell.jsx` (like Menu, Notifications, Search) lack `aria-label`s, which is an accessibility issue.
**Action:** Always add `aria-label` to icon-only buttons for screen readers, and provide Turkish translations to match the UI language.
