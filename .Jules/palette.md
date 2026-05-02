## 2025-05-22 - Standardized Async Loading States
**Learning:** Users often experience uncertainty during asynchronous actions (e.g., logging in, saving clients) if there's no immediate visual feedback. Centralizing loading logic in a shared `Button` component ensures consistent UX across the app and improves accessibility via `aria-busy`.
**Action:** Always prefer the shared `Button` component with `isLoading` and `loadingText` props for any action that triggers a network request or long-running process.
