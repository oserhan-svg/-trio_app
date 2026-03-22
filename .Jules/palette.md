## 2025-05-15 - Standardizing Core UI Accessibility
**Learning:** Standardizing core UI components (Button, Input) to handle accessibility (ARIA) and loading states internally is the preferred pattern in this repository to ensure a consistent user experience and reduce manual implementation errors.
**Action:** When creating new interactive components, always include appropriate ARIA labels and ensure form inputs are correctly linked to their labels and error states using `useId`.
