## 2024-03-27 - Icon-only buttons need aria-labels
**Learning:** Icon-only buttons without text content or aria-labels are completely inaccessible to screen readers. Relying only on visual icons or tooltip `title` attributes leaves screen reader users guessing the button's action.
**Action:** Always add descriptive `aria-label` attributes to any button that uses icons exclusively for its visual representation, especially for repetitive or dynamic elements like filter removal chips or saved search deletions.
