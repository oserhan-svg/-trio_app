## 2025-05-14 - Centralized Loading Feedback and Aria Labels
**Learning:** Centralizing loading states in the core Button component improves consistency and reduces boilerplate. Adding aria-labels to icon-only buttons in the main navigation and modals is critical for accessibility in a rich application like TrioApp.
**Action:** Always prefer adding `isLoading` props to reusable UI components rather than manual conditional rendering of spinners. Audit icon-only buttons for missing labels during any UI work.
