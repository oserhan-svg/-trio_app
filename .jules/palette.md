## 2024-03-24 - Add ARIA Labels to AppShell Buttons
**Learning:** Found multiple icon-only buttons in `AppShell.jsx` (menu toggle, theme toggle, notifications, logout) lacking `aria-label`s or proper `title` attributes. Notification button specifically lacked any text alternative. Added ARIA labels for accessibility.
**Action:** Always verify icon-only buttons have descriptive `aria-label` or `title` attributes, ensuring accessibility for screen reader users and better usability with tooltips. Translated labels to Turkish for consistency.
