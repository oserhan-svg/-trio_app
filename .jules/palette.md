## 2024-04-14 - Add aria-labels to icon-only buttons
**Learning:** Discovered a pattern in Detail views where interactive action buttons (like edit/save/delete) rely exclusively on icons without text or aria-labels, severely hindering screen reader accessibility.
**Action:** Always verify icon-only interactive elements possess descriptive `aria-label`s and `title` attributes for tooltips, ensuring both screen reader support and visual hover context.
