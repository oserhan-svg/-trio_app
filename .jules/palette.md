## 2024-09-24 - Accessibility improvements for icon-only buttons
**Learning:** Icon-only navigation layout buttons (Menu, Theme, Notifications) lacked `aria-label`s, which is critical for screen reader users to understand navigation.
**Action:** Always verify icon-only interactive elements in layouts contain descriptive `aria-label`s, especially since they are globally available components.