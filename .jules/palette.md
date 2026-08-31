## 2023-11-20 - [Focus Visibility for Icon Buttons]
**Learning:** Icon-only buttons lacking distinct focus indicators are invisible to keyboard navigators, severely degrading accessibility. In custom widget implementations, `focus-visible:ring-X` must be explicitly added as native focus styles are often suppressed by reset CSS.
**Action:** Always verify `focus-visible` classes when auditing custom UI components for a11y compliance, ensuring ring colors maintain sufficient contrast against their background.
