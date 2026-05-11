## 2025-05-14 - Centralized Loading State in Button Component
**Learning:** Hardcoding loading spinners and flex alignment at every call site (Login, Modals) leads to inconsistent UI and redundant code. Native `isLoading` support in a base Button component ensures consistent feedback and better accessibility (`aria-busy`).
**Action:** Always prefer a prop-driven `isLoading` state in base UI components over manual ternary rendering of spinners.

## 2025-05-14 - Accessibility for Icon-Only Buttons
**Learning:** This app uses many icon-only buttons (close buttons, action icons in tables) which often lack `aria-label`, making them unusable for screen readers despite having visual tooltips.
**Action:** When adding or modifying icon-only buttons, ensure an `aria-label` is present in the local language (Turkish for this app).
