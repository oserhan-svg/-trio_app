## 2024-05-20 - Ensure Tooltips and ARIA for Icon-only Buttons
**Learning:** Icon-only interactive elements in messaging interfaces must provide both visual tooltips (`title`) for pointer users and programmatic labels (`aria-label`) for screen readers. Using only one or neither severely degrades accessibility and discoverability. The UI must also be localized in Turkish.
**Action:** Always append both `title` and `aria-label` (with matching text) to icon-only buttons if they don't have visible text, ensuring consistent accessibility for all users.
