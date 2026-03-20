## 2026-03-05 - Standardized Core UI Accessibility
**Learning:** Core components like `Button` and `Input` should handle accessibility (ARIA labels, roles, states) and feedback (loading, errors) internally. This prevents developer error, reduces boilerplate, and ensures a consistent user experience across the entire application.
**Action:** Use `useId` for automatic form field linking and include built-in `isLoading` states for buttons that automatically handle disabled states and screen reader announcements.
