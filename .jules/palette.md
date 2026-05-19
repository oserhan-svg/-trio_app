# Palette Journal 🎨

## 2025-05-15 - Improving Accessibility for Icon-Only Buttons
**Learning:** Icon-only buttons in critical navigation and data table components (like `PropertyTable` and `MobileNav`) often lacked `aria-label` attributes, making them inaccessible to screen reader users in this application.
**Action:** Always ensure icon-only buttons have descriptive `aria-label` attributes, preferably in the application's primary language (Turkish in this case), and use `aria-live` for dynamic error states in inputs.
