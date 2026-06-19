## 2024-05-24 - Navigation Accessibility
**Learning:** The AppShell uses custom `button` elements for navigation (both sidebar and mobile bottom nav). When a navigation item is active, it only receives visual styling (`bg-blue-600` etc.) and there is no semantic indication to assistive technologies that it represents the current page.
**Action:** Always add `aria-current="page"` to the currently active navigation item when building custom navigation menus with buttons or links.
