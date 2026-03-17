## 2025-05-22 - [Accessibility & Feedback Standards]
**Learning:** Found that core UI components lacked proper ARIA associations and consistent loading states. Screen readers could not easily identify error messages or the purpose of icon-only buttons.
**Action:** Implemented 'isLoading' in Button with ARIA attributes. Updated Input to use 'aria-describedby' for errors. Enforced 'aria-label' on all icon-only buttons.
