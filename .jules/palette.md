## 2024-06-11 - Add Localized ARIA Labels to Header Buttons
**Learning:** Icon-only buttons in the main navigation header lack ARIA labels and keyboard focus states, making the primary AppShell interface inaccessible to screen reader and keyboard-only users.
**Action:** When implementing or modifying icon-only functional buttons (e.g., menu toggle, theme toggle, notifications), always ensure a localized `aria-label` is applied along with Tailwind's `focus-visible:` utilities to enforce keyboard accessibility without impacting mouse interactions.
