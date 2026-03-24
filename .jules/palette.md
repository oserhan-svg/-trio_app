## 2025-03-24 - Accessibility and Loading State Enhancements
**Learning:** Standardizing core UI components (Button, Input) with accessibility (ARIA) and loading states internally ensures a consistent and accessible user experience across the entire application while reducing manual implementation overhead. Stable ID generation via `useId` is critical for reliable label and error associations.
**Action:** Always include ARIA attributes (`aria-busy`, `aria-live`, `aria-invalid`, `aria-describedby`) and loading spinners in base UI components to maintain high UX standards automatically.
