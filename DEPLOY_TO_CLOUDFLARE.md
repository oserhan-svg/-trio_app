# Deploying Trio App Frontend to Cloudflare Pages

Follow these steps to migrate your frontend hosting from Netlify to Cloudflare Pages.

## Prerequisites
- A Cloudflare Account (Free is sufficient).
- Your code must be pushed to a GitHub repository.

## Step 1: Connect to Cloudflare
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to **Workers & Pages** in the sidebar.
3. Click the **Create Application** button.
4. Switch to the **Pages** tab.
5. Click **Connect to Git**.
6. Select your GitHub account and the repository (`emlak22` or your repo name).
7. Click **Begin setup**.

## Step 2: Configure Build Settings
This is the most critical step. Since your frontend is in a subdirectory (`client`), you must configure the "Root Directory".

*   **Project Name**: `trio-client` (or whatever you prefer)
*   **Production Branch**: `main` (or `master`)
*   **Framework Preset**: Select **Vite** (if available) or leave as None (Vite is usually detected).
*   **Build Command**: `npm run build`
*   **Build Output Directory**: `dist`
*   **Root Directory**: `client`  <-- **IMPORTANT: Do not forget this!**

## Step 3: Environment Variables
If you want to ensure your frontend connects to your backend correctly, verify your Environment Variables.

1. In the setup screen, verify "Environment Variables" section.
2. Add the following variable:
   - **Variable Name**: `VITE_API_URL`
   - **Value**: `https://trio-app-server.onrender.com/api` (Or your current active backend URL)

## Step 4: Deploy
1. Click **Save and Deploy**.
2. Cloudflare will clone your repo, install dependencies inside the `client` folder, and build your site.
3. Once finished, you will get a URL like `https://trio-client.pages.dev`.

## Step 5: (Optional) Custom Domain
1. After deployment, go to the **Custom Domains** tab in your Pages project.
2. Click **Set up a custom domain**.
3. Enter your domain (e.g., `app.trioemlak.com`).
4. Follow the DNS instructions (Cloudflare manages this automatically if your DNS is already there).

## Troubleshooting
- **404 on Routes**: Since this is a Single Page App (SPA), refreshing on a page like `/products` might cause a 404.
    - **Fix**: Cloudflare Pages handles SPAs automatically for standard formats. If you have issues, create a file named `_redirects` in your `client/public` folder with the content: `/* /index.html 200`. (Vite usually handles this with the build, but keeps this in mind).
