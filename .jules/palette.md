# Palette's Journal - Critical UX/Accessibility Learnings

## 2025-05-15 - Standardizing Interactive Feedback and Accessibility
**Learning:** Core UI components (Button, Input) lacked built-in support for loading states and advanced ARIA attributes, leading to inconsistent implementations and potential accessibility gaps. Standardizing these at the component level ensures a more robust and predictable UX.
**Action:** Enhance `Button` with `isLoading` support and `Input` with `useId` and error-related ARIA attributes. Apply these patterns to existing forms.
