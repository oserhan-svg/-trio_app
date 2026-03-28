## 2025-05-14 - Standardizing Core UI Component States
**Learning:** Standardizing core UI components (like Button) to handle internal loading states and accessibility attributes (aria-busy, aria-live) ensures a consistent user experience and reduces implementation errors across the application.
**Action:** Always favor extending base UI components with internal state handling (e.g., `isLoading`) rather than implementing manual loading logic in every page.

## 2025-05-14 - Localized Accessibility
**Learning:** In a localized application (Turkish in this case), it is critical that `aria-label` attributes match the language and value of existing `title` attributes to maintain consistency for screen reader users.
**Action:** When adding accessibility labels to icon-only buttons, grep for existing `title` or tooltip text to ensure the labels are accurate and appropriately localized.
