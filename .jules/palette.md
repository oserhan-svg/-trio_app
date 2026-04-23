## 2025-05-14 - Standardizing Asynchronous Feedback with Button Component
**Learning:** Manually managing loading states (spinners, text, disabled states) across multiple forms leads to UI inconsistency and code duplication. Centralizing this logic in a standard `Button` component ensures that all asynchronous actions provide consistent visual feedback and follow accessibility best practices (e.g., `aria-busy`).
**Action:** Always use the standardized `Button` component with `isLoading` and `loadingText` props for any asynchronous operations.

## 2025-05-14 - Accessibility and Interaction Safety in Buttons
**Learning:** Disabling a button while it is in a loading state is critical to prevent "double-submission" bugs, especially in forms that create resources or process payments. Adding `aria-busy="true"` ensures that screen reader users are aware of the ongoing process.
**Action:** Ensure the `Button` component automatically handles `disabled` and `aria-busy` when `isLoading` is true.
