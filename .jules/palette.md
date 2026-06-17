## YYYY-MM-DD - Missing `aria-current` on Active Navigation Buttons
**Learning:** Found that `<button>`-based navigation elements in the Sidebar and Bottom Navigation (`AppShell.jsx`) conditionally apply visual "active" styles without informing assistive technologies of the current page context using `aria-current="page"`.
**Action:** Always append `aria-current="page"` conditionally to active navigation elements to ensure screen readers identify the current page context.
