## 2025-04-18 - Centralizing Loading States and Table Accessibility

**Learning:** Centralizing loading states in a shared `Button` component ensures consistent visual feedback and accessibility (via `aria-busy` and `aria-live`). Icon-only buttons are a common accessibility gap that can be easily fixed with `aria-label`. Additionally, defining sub-components like `SortHeader` inside a parent's render function is a performance anti-pattern that triggers unnecessary re-mounts; hoisting them also provides a better opportunity to implement keyboard navigation (Tab and Enter/Space support).

**Action:** Standardize async actions to use the enhanced `Button` component. Always audit tables for keyboard accessibility and ensure icon-only actions have descriptive ARIA labels. Hoist helper components outside of the main render loop to preserve state and improve performance.
