## 2024-07-01 - Add Focus Styles to AppShell Menu Toggle
**Learning:** The main menu toggle button lacked proper visual feedback for keyboard users and aria-labels for screen readers, making it difficult to navigate the dashboard layout accessibly. Adding standard Tailwind `focus-visible:` classes improves the experience without altering the visual design for mouse users.
**Action:** When working on navigation components, always verify keyboard focus states (`focus-visible`) and explicitly provide ARIA labels or `title` attributes for icon-only buttons to ensure full accessibility.
