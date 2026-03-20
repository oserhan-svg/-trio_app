# Sentinel Security Journal

## 2026-03-20 - [Hardcoded Secret in Documentation]
**Vulnerability:** A live WebShare.io API key was found hardcoded in `server/PROXY_SETUP.md`.
**Learning:** Documentation and setup guides often contain "example" keys that are actually live or become outdated and forgotten, creating a silent security leak.
**Prevention:** Use placeholder values like `your_api_key_here` in all documentation. Implement pre-commit hooks or CI scans (like Gitleaks) to detect secrets in markdown files.
