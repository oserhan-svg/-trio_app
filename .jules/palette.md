## 2025-04-14 - Centralized Button Loading States
**Learning:** Centralizing asynchronous feedback (loading spinners) and related accessibility attributes (`aria-busy`, `aria-live`) into a core `Button` component significantly improves UI consistency and reduces manual boilerplate across multiple form-heavy components.
**Action:** Utilize the `isLoading` prop on the standardized `Button` component instead of manual conditional rendering for all future async actions to ensure consistent UX and screen-reader support.
