## 2025-02-23 - AppShell Navigation Focus & ARIA Labels
**Learning:** Icon-only navigation actions (Menu, Theme, Notifications) and search wrappers in the top bar lacked programmatic labels and keyboard focus indicators, making them invisible to screen readers and difficult to access via keyboard navigation.
**Action:** Use Tailwind `focus-visible:` on buttons and `focus-within:` on input wrappers to surface focus state natively without disrupting mouse interactions, and ensure `aria-label` is applied using the localized project vocabulary.
