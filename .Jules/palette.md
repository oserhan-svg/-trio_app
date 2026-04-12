## 2026-04-12 - [Standardized Loading States and Accessibility]
**Learning:** Centralizing loading states in a base `Button` component significantly reduces code duplication and ensures consistent UX across the app. Deriving state from props (controlled components) in complex selects (like `NeighborhoodMultiSelect`) prevents "syncing state" bugs and cascading renders.
**Action:** Always prefer deriving local UI state directly from props instead of using `useEffect` for synchronization. Use `aria-busy` and `aria-live` on buttons with loading states to improve screen reader experience.
