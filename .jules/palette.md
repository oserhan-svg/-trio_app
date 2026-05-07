## 2025-05-15 - Reusable Button Loading Pattern
**Learning:** Centralizing loading states in a core Button component reduces boilerplate and ensures consistent accessibility (aria-busy, disabled state) across the application.
**Action:** Always prefer using the `isLoading` prop on the standardized Button component instead of manual conditional rendering for spinners in buttons.

## 2025-05-15 - Accessibility for Icon-Only Buttons
**Learning:** Icon-only buttons with `title` attributes are common in this codebase but are not fully accessible to screen readers without corresponding `aria-label` attributes.
**Action:** When adding or modifying icon-only buttons, ensure an `aria-label` is provided that matches or improves upon the `title` text.
