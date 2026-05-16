## 2026-05-20 - Accessibility Audit & Standardized Feedback
**Learning:** Icon-only buttons without `aria-label` are inaccessible to screen readers, and asynchronous actions (like login) require both visual (spinner) and accessible (`aria-busy`) feedback to ensure a smooth user experience.
**Action:** Always use the `isLoading` prop in the standardized `Button` component for async actions, and ensure all icon-only buttons have descriptive `aria-label` attributes.
