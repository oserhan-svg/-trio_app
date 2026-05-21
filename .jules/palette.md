## 2024-05-21 - Improving Custom Navigation and Focus Visibility
**Learning:** Visual active classes in custom `<button>` based navigations are insufficient for assistive technologies. Also, container `focus-within:` is required for search wrappers when inner inputs use `focus:ring-0`.
**Action:** Always add `aria-current="page"` dynamically to active navigation items and utilize `focus-visible:` and `focus-within:` utilities for proper keyboard navigation cues.
