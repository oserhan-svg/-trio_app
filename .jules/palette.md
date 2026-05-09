## 2025-05-09 - Native loading states for UI components
**Learning:** Adding `isLoading` props to core UI components like `Button` significantly improves developer velocity and ensures consistent UX and accessibility (ARIA attributes) across the app, compared to manual loading state management in every component.
**Action:** Always prefer extending base UI components with standard states (loading, error, success) rather than handling them ad-hoc in feature components.
