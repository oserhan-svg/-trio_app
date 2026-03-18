## 2026-03-18 - AppShell Keyboard/Screen Reader Navigation
**Learning:** The global AppShell component has several key actions (Menu toggle, Theme toggle, Notifications) that lack text labels, making them inaccessible to screen readers and difficult to interpret without visual context.
**Action:** Ensure all icon-only control buttons, especially in global layout components, receive appropriate `aria-label` attributes that reflect their current state (e.g. 'Menüyü kapat' vs 'Menüyü aç').
