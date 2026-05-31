## 2024-05-31 - Navigation Accessibility
**Learning:** When building custom navigation menus with `<button>` elements (e.g., in AppShell), conditionally append `aria-current="page"` for the active item. Visual active classes are insufficient for assistive technologies to identify the current page context.
**Action:** Always add `aria-current="page"` to active navigation buttons and ensure icon-only buttons have descriptive `aria-label`s and `focus-visible` styles.
