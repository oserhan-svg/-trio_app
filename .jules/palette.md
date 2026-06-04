## 2024-06-04 - Improve Assistive Navigation in Custom Menus
**Learning:** In custom React component navigation (like AppShell's sidebar and bottom nav) where `<button>` tags are used instead of native anchor tags (`<a>`), visual active classes alone fail to announce the active page to assistive technologies.
**Action:** Always conditionally append `aria-current="page"` for the active item when building custom navigation menus with `<button>` elements to ensure screen readers correctly identify the current page context.
