## 2025-05-15 - [Accessible Core Components]
**Learning:** Core UI components (Button, Input) were missing critical ARIA attributes (aria-busy, aria-invalid, aria-describedby) leading to poor screen reader support during async operations and form validation. Using `inline-flex` for the Button component ensures it behaves predictably in various layouts.
**Action:** Always include ARIA linkage in core components and prefer `inline-flex` over `flex` for buttons to prevent layout shifts.
