## 2025-05-12 - Reusable Button Loading Pattern
**Learning:** Manual loading state management in buttons leads to inconsistent UI (different spinner styles, missing ARIA attributes). Centralizing loading logic in a core `Button` component ensures that `aria-busy` and `aria-live` are always correctly applied alongside visual feedback.
**Action:** Use the `isLoading` prop on the core `Button` component instead of manual conditional rendering for all future async operations.

## 2025-05-12 - Accessible Icon-Only Actions
**Learning:** Icon-only buttons with only `title` attributes are often skipped or poorly announced by screen readers. Parity between visual tooltips (`title`) and ARIA labels (`aria-label`) is essential for accessibility in data-heavy tables.
**Action:** Always provide an `aria-label` that matches the `title` for any button or interactive element that does not contain descriptive text.
