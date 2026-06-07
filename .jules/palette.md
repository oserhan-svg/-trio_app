## 2024-06-08 - Add aria-current to navigation items
**Learning:** Visual active states on navigation menus are insufficient for screen readers; they need `aria-current="page"` to programmatically identify the active item.
**Action:** Always add `aria-current="page"` conditionally to active navigation buttons or links.