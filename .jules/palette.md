## 2024-03-20 - Icon-only Buttons ARIA Labels
**Learning:** Found several icon-only buttons lacking `aria-label`s in the application. This makes the UI completely inaccessible to screen reader users because they can't determine the button's action.
**Action:** Always verify icon-only buttons include `aria-label` attributes translated to Turkish to match the app's localized language.
