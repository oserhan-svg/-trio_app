## 2024-08-04 - OpportunityCarousel Navigation Accessibility
**Learning:** Icon-only navigation buttons in custom carousel components often lack screen-reader context if only visual indicators (like `ChevronLeft`/`ChevronRight` from `lucide-react`) are used.
**Action:** When implementing or modifying custom carousels or paginated lists with icon-only controls, always add localized `aria-label`s (e.g., "Önceki" for Previous, "Sonraki" for Next) to the enclosing `<button>` elements to ensure screen-reader users understand their function.
