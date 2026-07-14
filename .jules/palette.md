## 2024-07-14 - Accessibility Labels for Icon-only Controls
**Learning:** React requires explicit Unicode escape sequences (like `\u0131` instead of standard text or single-backslash sequences like `\304\261`) wrapped in curly braces (e.g. `{"H\u0131zl\u0131"}`) to safely output localized non-ASCII strings as attributes within JSX.
**Action:** Always use curly-braced unicode escapes for localized JSX attributes instead of unescaped text or octal notation to prevent rendering or linting issues.
