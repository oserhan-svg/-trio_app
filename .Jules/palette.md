## 2025-05-15 - Standardized Button Loading States
**Learning:** Centralizing loading states in a shared `Button` component using `isLoading` and `loadingText` props significantly improves UX consistency and accessibility (via `aria-busy` and `aria-live`). It also reduces boilerplate in form components.
**Action:** Always check if a shared `Button` component exists and has loading props before implementing custom loading logic in forms. If it doesn't, enhance the `Button` component first.
