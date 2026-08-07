## 2024-05-18 - AppShell Navigation Accessibility
**Learning:** Icon-only buttons in the application's top navigation (AppShell) lack `aria-label` attributes and clear keyboard focus states, hindering screen reader use and keyboard navigation.
**Action:** Ensure all icon-only buttons receive descriptive `aria-label`s and consistent `focus-visible` ring styles (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`) for accessible interactions.
