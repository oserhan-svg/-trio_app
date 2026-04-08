## 2025-05-14 - Centralized Loading States and ARIA Integration
**Learning:** Centralizing loading states within a base `Button` component using an `isLoading` prop, rather than manual text toggling in parent components, ensures consistent visual feedback (spinners) and simplifies accessibility implementation (`aria-busy`, `aria-live`) across the entire app.
**Action:** Always prefer adding an `isLoading` prop to base UI components and use standard ARIA attributes to communicate async states to screen readers.
