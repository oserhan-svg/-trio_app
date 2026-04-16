## 2024-04-16 - Add ARIA label to Property Detail Modal Close Button
**Learning:** Icon-only buttons lacking ARIA labels are a recurring accessibility issue in modals across the design system. Finding deeply nested components like PropertyDetailModal requires careful setup to render via test pages when not directly imported into main flows.
**Action:** Next time, aggressively search for `<button>` tags containing only Lucide `<Icon>` elements across all modals and proactively add `aria-label` with proper Turkish translations and `focus-visible:` utility classes.
