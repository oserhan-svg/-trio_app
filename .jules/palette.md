## 2024-05-20 - Layout Icon-Only Buttons Accessibility
**Learning:** Core layout elements like Topbars often use icon-only buttons for menus, themes, and notifications. Without proper `aria-label`s localized in Turkish and `focus-visible` styling, screen reader users miss context and keyboard users lack visual feedback on interactive navigation items.
**Action:** Always add localized `aria-label` attributes and `focus-visible` utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`) to any icon-only interactive element to ensure full accessibility.
