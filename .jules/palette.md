## 2024-05-18 - Header Accessibility and Focus Indicators
**Learning:** Icon-only header elements like Menu, Theme, and Notifications in this app often lack explicit `aria-label`s and clear visual focus indicators for keyboard users, making keyboard navigation difficult and screen reader usage opaque.
**Action:** Always add descriptive `aria-label`s (translated to Turkish) to icon-only buttons, and apply `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none` to interactive elements to ensure clear keyboard focus visibility without relying solely on hover states.
