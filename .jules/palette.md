## 2025-05-15 - Centralized Loading State in Button Component
**Learning:** Managing loading states individually in every form component (Login, Modals) leads to inconsistent UI, redundant code, and potential accessibility gaps (missing `aria-busy`).
**Action:** Centralize `isLoading` logic in the core `Button` component. Automatically handle the disabled state, `aria-busy` attribute, and spinner placement. This ensures a consistent "busy" experience across the app and simplifies form implementation.
