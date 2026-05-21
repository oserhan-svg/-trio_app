## 2024-05-22 - Add ARIA Labels and Active Page Current State to AppShell Buttons
**Learning:** Icon-only buttons in top navigation (Theme toggle, Notifications) were missing ARIA labels, creating accessibility issues for screen readers. The active state indicator for navigation buttons only used visual styling, failing to inform assistive technologies.
**Action:** Ensure all icon-only buttons include descriptive `aria-label`s. When building custom navigation with `<button>`, conditionally append `aria-current="page"` when the item is active to semantically represent the current page.
