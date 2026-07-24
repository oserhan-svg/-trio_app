## 2025-02-28 - Missing Playwright Fallback

**Learning:** When trying to use Playwright on complex pages like the Dashboard with many dynamic API calls, mocking all of them effectively to prevent React Error Boundaries from catching exceptions is very difficult.

**Action:** If Playwright mocking fails, skip Playwright and rely on static verification (`grep`, `lint`, `build`) before submitting.
