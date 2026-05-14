## 2025-05-15 - [UX/Accessibility Enhancements for Core Components]
**Learning:** Generic UI components like `Button` and `Input` are the highest leverage points for accessibility. Using `aria-invalid` and `aria-describedby` in `Input` ensures screen readers correctly associate error messages with their respective fields. In `Button`, delegating the `isLoading` state to the component ensures consistent spinner placement and layout stability across the app.
**Action:** Always include accessibility attributes (`aria-*`) when building or modifying core UI components.

## 2025-05-15 - [Layout Conflict Management]
**Learning:** In components with internal loading states (like the new `Button`), icons provided as children can conflict visually with the internal spinner. Conditional rendering in the consumer (e.g., `Login.jsx`) is necessary to maintain a clean UI during transitions.
**Action:** When using a button with `isLoading={true}`, ensure that other icons or high-priority children are conditionally hidden to avoid visual overlap.
