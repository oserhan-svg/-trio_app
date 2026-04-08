## 2024-04-07 - Icon-only buttons missing ARIA labels and focus states
**Learning:** Found several icon-only buttons in the WhatsAppSidebar component without `aria-label`s or keyboard focus indicators, making them inaccessible to screen readers and difficult to navigate via keyboard. This seems to be a common pattern for utility buttons across the app.
**Action:** Always ensure icon-only buttons have descriptive `aria-label` attributes and implement clear `focus-visible:` utility classes to support keyboard navigation.
