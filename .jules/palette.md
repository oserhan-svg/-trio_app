## 2025-05-15 - [Loading State Feedback]
**Learning:** Adding an `isLoading` prop to core Button components significantly improves UX consistency and accessibility (aria-busy, aria-live) across the app while preventing duplicate form submissions.
**Action:** Always favor a central `isLoading` prop in UI components over manual local state rendering for icons and spinners.
