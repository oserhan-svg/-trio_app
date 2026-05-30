## 2024-05-24 - Navigation Menu Accessibility
**Learning:** Custom navigation menus built with `<button>` elements need `aria-current="page"` for the active item. Visual active classes are insufficient for assistive technologies to identify the current page context.
**Action:** Always append `aria-current="page"` conditionally when `active` is true in navigation components.
