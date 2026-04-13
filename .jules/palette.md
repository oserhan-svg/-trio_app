## 2024-04-14 - Social Assistant Widget Accessibility
**Learning:** Found that secondary icon-only action buttons (like Copy) within widgets lacked basic accessibility markers and focus indicators, making them difficult to use for keyboard-only or screen reader users. The application also requires Turkish localization for all `aria-label` text.
**Action:** Always add localized `aria-label` and `title` attributes, along with `focus-visible` utility classes (e.g., `focus-visible:ring-2`), to all new or modified icon-only interactive elements to ensure full accessibility support.
