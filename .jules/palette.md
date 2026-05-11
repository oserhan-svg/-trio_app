## 2024-05-24 - Accessibility of Custom Navigation
**Learning:** Custom `<button>` elements used for navigation links lack the implicit active state semantics of `<a>` tags or framework `NavLink`s. Visual `active` classes are insufficient for screen readers.
**Action:** Always append `aria-current="page"` conditionally when building custom navigation menus with `<button>` tags to ensure assistive tech users know their current location.
