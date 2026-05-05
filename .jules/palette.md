## 2025-05-15 - Centralizing UI Components for Consistency and Accessibility
**Learning:** Redundant component definitions (like `AuthEditModal` being defined both in `modals/` and locally in `MyListings.jsx`) lead to inconsistent UX, where brand colors and accessibility improvements (like ARIA labels) are applied unevenly.
**Action:** Always check for existing shared components before creating local ones, and centralize common logic like loading states into base UI components (e.g., `Button`).
