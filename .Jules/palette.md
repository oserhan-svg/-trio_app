## 2025-05-14 - [Centralized Button Loading States & Table A11y]
**Learning:** Centralizing loading states in a shared component reduces boilerplate and ensures consistent micro-animations (like spinners) across the app. Accessible labels for icon-only buttons are critical for screen reader support in data-heavy tables.
**Action:** Always prefer using a standard `Button` component with `isLoading` props over manual ternary conditions in forms. Ensure all `lucide-react` icons used as buttons have corresponding `aria-label` attributes.
