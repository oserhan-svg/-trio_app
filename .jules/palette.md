## 2024-06-29 - Missing ARIA labels in AppShell header buttons
**Learning:** Icon-only buttons (like menu toggle, theme toggle, notifications, logout) in the main navigation header lack ARIA labels, making them inaccessible to screen readers. Furthermore, keyboard focus indicators were missing, making keyboard navigation difficult.
**Action:** Add aria-label and ensure focus-visible styles (like focus-visible:ring-2 focus-visible:ring-blue-500) are present for accessibility on all icon-only interactive elements.
