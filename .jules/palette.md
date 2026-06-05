## 2024-05-24 - Custom Navigation Menu Accessibility
**Learning:** This application extensively uses `<button>` elements rather than native `<a>` tags for navigation in key structural components (like AppShell). Because they aren't native links, assistive technologies cannot automatically announce the active page context based on standard routing.
**Action:** When building custom navigation menus with `<button>` elements, always conditionally append `aria-current="page"` for the active item. Visual active classes alone are insufficient.
