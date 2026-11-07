## 2026-05-22 - Accessibility Gaps in Icon-Only Buttons
**Learning:** In a highly visual dashboard, developers often rely on `title` attributes for tooltips, which are insufficient for screen readers. Icon-only buttons for critical actions (like property analysis or mobile navigation) must have explicit `aria-label` attributes to ensure parity of information for all users.
**Action:** Always pair `title` with a matching `aria-label` for any button or link that does not contain visible text labels.
