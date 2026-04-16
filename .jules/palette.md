## 2026-04-16 - [Button Loading State & Modal Accessibility]
**Learning:** Centralizing loading states within a core `Button` component reduces code duplication and ensures a consistent user experience across the application. Adding ARIA labels to icon-only buttons is a small but critical touch for screen reader accessibility.
**Action:** Always check for icon-only buttons and ensure they have descriptive `aria-label` attributes. Use the centralized `Button` component's `isLoading` prop instead of manual ternary conditions for loading states.
