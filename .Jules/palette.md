## 2025-04-30 - Standardizing Async Feedback and Accessibility

**Learning:** Centralizing asynchronous feedback via a standardized `Button` component with `isLoading` and `loadingText` props significantly reduces UI redundancy and ensures accessible loading states (via `aria-busy` and `disabled`) across the application. Additionally, utilizing React's `useId` in shared components like `Input` guarantees accessible label-input associations without requiring manual ID management.

**Action:** Always leverage the enhanced `Button` and `Input` components for new forms and actions to maintain UX consistency and accessibility standards.
