## 2025-05-15 - Standardizing Interaction Feedback and Accessibility
**Learning:** Core UI components (Button, Input) lacked unified feedback mechanisms (loading states) and automatic accessibility hooks (stable ID generation), leading to inconsistent UX and potential screen reader issues in modal forms.
**Action:** Use React 19's `useId` in base `Input` components to ensure label-input linkage and expose `isLoading`/`loadingText` props in `Button` to centralize state-driven visual feedback and ARIA attributes (`aria-busy`).
