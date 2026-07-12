## 2024-07-11 - Dynamic Port Assignment in Local Dev
**Learning:** The frontend build tool (Vite) can auto-assign ports (e.g., 5174, 5175) if the default port (5173) is busy during local startup.
**Action:** When writing Playwright verification scripts, always check Vite's startup logs to confirm the correct port instead of hardcoding `localhost:5173`, to avoid `ERR_CONNECTION_REFUSED` errors in headless browsers.

## 2024-07-11 - Constructing Accurate Git Merge Diffs
**Learning:** Using byte-inspecting tools like `cat -v` or `od -c` on files containing Turkish characters alters the terminal output (e.g., to `M-DM-1`), preventing the accurate construction of `SEARCH` blocks for diff operations.
**Action:** Use only standard text output commands (like `sed -n '<range>p'`) without modifiers to observe and perfectly match the exact characters (or octal escape sequences) required for successful `replace_with_git_merge_diff` applications.