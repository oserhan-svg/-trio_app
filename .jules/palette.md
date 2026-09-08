## 2026-09-08 - Icon-Only Button Accessibility in SocialAssistantWidget
**Learning:** Icon-only buttons for actions like "copy to clipboard" (`<Copy />`) were missing accessible names, making them unreadable for screen readers. Furthermore, lacking `focus-visible` states makes keyboard navigation difficult.
**Action:** Consistently add `aria-label` (and optionally `title` for tooltip behavior) to icon-only interactive elements, ensuring the text is localized (e.g., 'Metni kopyala'). Always include clear focus rings (e.g., `focus-visible:ring-2`) to support keyboard navigation.
