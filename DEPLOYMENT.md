# Chronicle Journal — Production Deployment Guide

This guide provides step-by-step instructions for deploying Chronicle online to production using the **Cloudflare Free Tier** (Cloudflare Pages, Edge Functions, and Cloudflare D1).

---

## 📋 Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (100% free tier is sufficient).
- [Node.js](https://nodejs.org/) v20+ and `npm` installed locally.
- Git repository hosted on GitHub or GitLab (for automatic deployments).
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed (`npm install -g wrangler` or via `npx wrangler`).

---

## 🚀 Deployment Method 1: Cloudflare Pages Git Integration (Recommended)

Automatic CI/CD deployment on every `git push`.

### 1. Push Code to GitHub / GitLab
```bash
git add .
git commit -m "chore: prepare for production release"
git push origin main
```

### 2. Connect Repository in Cloudflare Dashboard
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, go to **Compute (Workers) > Workers & Pages**.
3. Click **Create** > select **Pages** tab > click **Connect to Git**.
4. Authorize Cloudflare to access your GitHub or GitLab repository.
5. Select the `Journal` repository.

### 3. Configure Build Settings
Fill in the following build options:
- **Project name**: `chronicle-journal`
- **Production branch**: `main`
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty or default)

### 4. Deploy
Click **Save and Deploy**. Cloudflare Pages will build the application, bundle static assets, compile Functions under `functions/`, and provide a production URL (e.g., `https://chronicle-journal.pages.dev`).

---

## ⚡ Deployment Method 2: Direct CLI Deployment via Wrangler

If you prefer deploying directly from your local terminal or CI script:

```bash
# 1. Log in to your Cloudflare account
npx wrangler login

# 2. Build the production bundle
npm run build

# 3. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name chronicle-journal
```

---

## 🗄️ Setting Up Cloudflare D1 Database (Optional Cloud Sync)

Chronicle functions 100% offline out-of-the-box using browser IndexedDB. To enable edge persistence and multi-device sync with Cloudflare D1:

### 1. Create the D1 Database
```bash
npx wrangler d1 create journal_db
```
Wrangler will output the created database details:
```
✅ Successfully created DB 'journal_db' with ID 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
```

### 2. Update `wrangler.jsonc`
Replace `your-d1-database-id-here` with the database UUID generated above:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "journal_db",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
]
```

### 3. Execute the SQL Schema Migration
Run the schema setup script against your remote D1 database:
```bash
npx wrangler d1 execute journal_db --remote --file=functions/api/d1-schema.sql
```

### 4. Link D1 to Cloudflare Pages Project
If deploying via Git:
1. In Cloudflare Dashboard, go to **Workers & Pages** > **chronicle-journal** > **Settings** > **Functions**.
2. Scroll to **D1 Database Bindings** > click **Add binding**.
3. Set **Variable name** to `DB`.
4. Select your **D1 database**: `journal_db`.
5. Click **Save**.

---

## 🔐 Configuring Production Secrets & Environment Variables

To protect your API sync endpoint and customize abuse prevention settings:

1. In Cloudflare Dashboard, navigate to **Pages** > **chronicle-journal** > **Settings** > **Environment variables**.
2. Click **Add variables** for **Production**:
   - `SYNC_SECRET`: Set a secure random string (e.g. `openssl rand -hex 32`). When set, sync calls require this passkey.
   - `RATE_LIMIT_PER_MINUTE`: Set the maximum requests per minute per IP (e.g., `60`).
3. Click **Save**.

Or configure using Wrangler secret commands:
```bash
npx wrangler pages secret put SYNC_SECRET --project-name chronicle-journal
```

---

## 🌐 Custom Domain & Free SSL/TLS Configuration

1. In Cloudflare Pages project, click the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter your domain (e.g., `journal.yourdomain.com`).
4. If your domain is already on Cloudflare DNS, Cloudflare will automatically provision a CNAME record and issue an SSL/TLS certificate.
5. In **SSL/TLS** settings on Cloudflare, ensure encryption mode is set to **Full (strict)**.

---

## 🛡️ Cloudflare Security & WAF Recommendations

To maximize protection against automated scrapers and abuse:

1. **Bot Fight Mode**:
   - Go to **Security > Bots** in the Cloudflare Dashboard.
   - Toggle **Bot Fight Mode** to **On** (challenges known malicious bots and automated scrapers).
2. **Security Headers**:
   - Chronicle already includes `public/_headers` with Content-Security-Policy, X-Frame-Options, HSTS, and Permissions-Policy. These are applied automatically by Cloudflare Pages.
3. **Always Use HTTPS**:
   - In Cloudflare Dashboard > **SSL/TLS > Edge Certificates**, enable **Always Use HTTPS** and **Automatic HTTPS Rewrites**.
4. **Minimum TLS Version**:
   - Set **Minimum TLS Version** to **TLS 1.2** or **TLS 1.3**.

---

## ✅ Post-Deployment Verification Checklist

- [ ] Visit `https://your-pages-url.pages.dev` in a browser.
- [ ] Confirm typography, ambient audio synthesizer, and paper textures load smoothly.
- [ ] Open DevTools Network tab: verify `Content-Security-Policy`, `X-Frame-Options: DENY`, and `Strict-Transport-Security` headers are present.
- [ ] Write a test journal entry, draw a sketch, and pin a photo.
- [ ] Refresh the page to verify instant IndexedDB offline persistence.
- [ ] Click the **Privacy** button in the header: verify the Storage Audit displays accurate metrics and the Wipe feature functions properly.
- [ ] Click **Storage / Sync** to test export and edge sync operations.
