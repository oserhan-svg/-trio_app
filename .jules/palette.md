## 2025-05-15 - [Accessibility & Feedback]
**Learning:** Icon-only buttons in the navigation and sidebar lacked descriptive 'aria-label' attributes, making them inaccessible to screen readers. Additionally, core action buttons did not provide visual feedback during asynchronous operations, potentially leading to redundant clicks and a poor user experience.
**Action:** Standardize the 'Button' UI component to handle 'isLoading' states with 'aria-busy' and 'aria-live' attributes. Always provide 'aria-label' for interactive elements that do not contain visible text.
