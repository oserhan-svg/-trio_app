## 2025-05-14 - Standardizing Async Feedback and Form Accessibility

**Learning:** Base UI components like `Button` and `Input` are the most effective places to implement accessibility and UX improvements. Adding an `isLoading` prop to `Button` not only improves the user experience by providing immediate feedback but also encourages developers to handle async states correctly. For forms, using `aria-describedby` to link error messages to inputs is a critical accessibility requirement that is often missed when building custom input components.

**Action:** Always check base UI components for missing feedback states (loading, disabled) and accessibility attributes (ARIA) before implementing features. Ensure that all icon-only buttons in the layout have descriptive `aria-label` attributes, especially in collapsed sidebars.
