## 2024-05-06 - Missing ARIA labels on Icon-only Buttons
**Learning:** Found several icon-only buttons across structural layout components (`AppShell`, `MobileNav`, carousels, and modals) lacking `aria-label` attributes. This breaks accessibility for screen reader users, who will just hear "button" without context for what actions like the menu toggle, notifications, next/prev slide, or close actions do.
**Action:** Always ensure that `<button>` tags without text content have descriptive `aria-label`s, especially for globally reused interactive elements like menus and modals.
