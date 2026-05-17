## 2024-05-24 - Navigation Context Accessibility
**Learning:** Visual active classes in custom React navigation components (`<button>` instead of `<NavLink>`) are insufficient for assistive technologies to identify the current page context.
**Action:** Always conditionally append `aria-current="page"` to custom navigation items to properly convey state to screen readers.
