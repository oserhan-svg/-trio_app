## 2024-05-20 - Custom Nav Menu Accessibility
**Learning:** When building custom navigation menus with `<button>` elements (e.g., in AppShell), conditionally append `aria-current="page"` for the active item. Visual active classes are insufficient for assistive technologies to identify the current page context.
**Action:** Always add `aria-current="page"` to active navigation items, use explicit Turkish `aria-label`s for icon-only buttons, and ensure interactive elements have clear `focus-visible` classes.
