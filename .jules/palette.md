## 2026-05-19 - Accessibility Additions for AppShell Buttons

**Learning:** Important app layout components like `AppShell` in this codebase miss `aria-label`s on icon-only interactive buttons (like Menu toggles, Notifications, Dark Mode switch, Search and Navigation items). Active page status is missing from side-menu. Furthermore, interactive buttons don't have good focus indicators making keyboard accessibility poor.

**Action:** Consistently include `aria-label`s on all icon-only buttons to allow screen readers to understand the intent. Add `aria-current="page"` to indicate active elements for navigation menus. Include Tailwind `focus-visible:ring-2` to add a focus outline for better keyboard accessibility.
