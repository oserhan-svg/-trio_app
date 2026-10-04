## 2025-02-24 - False Positive in Code Review regarding isAdmin middleware
**Vulnerability:** N/A (Reviewer Feedback)
**Learning:** Automated code review tools flagged `isAdmin` as a hallucinated/missing export, or suggested chaining `authenticateToken, isAdmin`. However, `isAdmin` internally wraps `authenticateToken`. So using just `isAdmin` is the correct approach for securing admin routes in this repository to prevent duplicate authentication checks.
**Prevention:** Safely ignore false positive warnings from automated code reviews regarding `isAdmin` and `authenticateToken` chaining.
