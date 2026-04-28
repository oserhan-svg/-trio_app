## 2025-04-28 - Image Carousel Button Accessibility
**Learning:** Icon-only buttons used for image carousels that are hidden by default (`opacity-0`) and only shown on hover (`group-hover:opacity-100`) break keyboard navigation accessibility, as they remain invisible when tabbed to.
**Action:** When implementing hidden-on-hover UI elements that are interactive, ensure `focus-visible:opacity-100` (along with standard focus rings) is added so they become visible to keyboard users when focused.
