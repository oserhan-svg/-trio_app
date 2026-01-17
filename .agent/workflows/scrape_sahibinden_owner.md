---
description: How to scrape Sahibinden.com for "Owner" (Bireysel) listings using a manual trigger and specific URL filter.
---

# Sahibinden "Owner" Scraping Workflow

This workflow describes the solution for extracting "Sahibinden Satılık" (From Owner) listings, which are often missed by standard scrapers due to UI changes or anti-bot measures.

## 1. Prerequisites
- **Admin Access:** You must be logged into the dashboard (`admin@emlak22.com`).
- **Chrome:** The server must attempt to launch Chrome in non-headless mode.
- **Specific URL:** You need the exact Sahibinden URL filtered for the target listings (e.g. `.../sahibinden?address...`).

## 2. The Solution Logic
The standard scraper fails to detect "Owner" vs "Agent" solely by text analysis because the "Kimden" column is often hidden.
To fix this, we force the scraper to tag all results from a specific URL as `owner`.

### Key Code Modification (`stealthScraper.js`)
The `scrapeSahibindenStealth` function now accepts a second argument `forcedSellerType`.
```javascript
// Usage:
scrapeSahibindenStealth(TARGET_URL, 'owner');
```

## 3. Execution Steps
To scrape new "Owner" listings:

1.  **Find the URL:** Go to sahibinden.com, filter by "Sahibinden", and copy the browser URL.
2.  **Edit Script:** Open `server/test_sahibinden_owner.js`.
3.  **Update URL:** Paste your URL into the `OWNER_URL` constant.
    ```javascript
    const OWNER_URL = 'https://www.sahibinden.com/satilik-daire/sahibinden?...';
    ```
4.  **Run Script:**
    ```bash
    cd server
    node test_sahibinden_owner.js
    ```
5.  **Solve Cloudflare:** A Chrome window will open. If you see "Verify you are human", click and hold the button.
6.  **Wait:** The script will extract 10-20 listings and save them to the DB with `seller_type: 'owner'`.

## 4. Troubleshooting
- **Cloudflare Loop:** If it asks repeatedly, close the window and try again after 2 minutes.
- **No Data:** Check if the URL actually has listings in a regular browser first.
- **403 Errors:** Ensure your dashboard token is valid (Logout/Login).

// turbo
## 5. View Results
Go to Dashboard -> Filter "Kimden: Bireysel (Sahibinden)".
