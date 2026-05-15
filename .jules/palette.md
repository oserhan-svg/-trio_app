## 2025-05-15 - Accessibility and Feedback Standardization

**Learning:** Icon-only buttons without `aria-label` are inaccessible to screen reader users, even if they have `title` attributes. Centralizing loading logic in the `Button` component ensures consistent feedback and reduces code duplication.

**Action:** Always include `aria-label` for icon-only buttons. Use `aria-invalid` and `aria-describedby` in `Input` components to link error messages. Leverage a unified `isLoading` prop in `Button` for consistent async feedback.
