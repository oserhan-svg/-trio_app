## 2025-05-14 - [Component Accessibility]
**Learning:** Core UI components (Button, Input) lacked standard accessibility attributes for state and error handling, which could lead to a fragmented experience for screen reader users.
**Action:** Always include `aria-busy` and `aria-live` for loading states in buttons, and `aria-invalid`, `aria-describedby` for form inputs with errors.
