## 2026-11-07 - Add ARIA Labels to Navigation Buttons
**Learning:** Icon-only navigation buttons in the main AppShell layout lacked accessible names, making them difficult to use for screen reader users. The application is localized in Turkish, so all accessible names must be in Turkish to match the language.
**Action:** Added Turkish `aria-label` attributes and matching `title` tooltips to the menu toggle, theme toggle, and notifications buttons in the main application shell layout to ensure consistent accessibility and UX.
