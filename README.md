# Chronicle — Tactile Real-Time Journal

A realistic, skeuomorphic journal web application designed for mindful writing, sensory tactile feedback, and freeform scrapbooking. Built with a **local-first privacy architecture** and production-ready for **Cloudflare Free Tier** (Cloudflare Pages, D1 Database, and Edge Functions).

![Chronicle Banner](https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80)

---

## 📚 Essential Documentation

- 🚀 [**Production Deployment Guide (DEPLOYMENT.md)**](file:///d:/Projects/Journal/DEPLOYMENT.md): Step-by-step instructions for deploying to Cloudflare Pages, configuring custom domains, SSL/TLS, and D1 database migrations.
- 🛡️ [**Security Policy & Architecture (SECURITY.md)**](file:///d:/Projects/Journal/SECURITY.md): Threat modeling, edge rate limiting, abuse prevention, CSP headers, and vulnerability disclosure.
- 🕊️ [**Privacy Policy & Data Sovereignty (PRIVACY.md)**](file:///d:/Projects/Journal/PRIVACY.md): Zero-tracking commitment, local IndexedDB isolation, and GDPR/CCPA data rights.

---

## ✨ Features

### 📖 Realistic Skeuomorphic Book
- **Open Book Layout**: Two-page desktop spread with leather casing (Cognac, Dark Espresso, Emerald), stitched edges, brass corner protectors, and spine crease depth.
- **Realistic Page Turning**: Drag page corners or use arrow keys with authentic paper-curl physics and synchronized paper rustling sounds.
- **Satin Ribbon Bookmark**: Drag or click the ribbon bookmark to save your place and jump back anytime.
- **Tactile Paper Styles**: Lined paper with faint red margin, vintage parchment, bullet journal dot-grid, or smooth plain ivory.

### ✍️ "Click Anywhere to Type" Freeform Writing
- **Spontaneous Placement**: Click anywhere on the journal page to start writing immediately.
- **Authentic Handwriting Typography**: Choose between *Caveat*, *Kalam*, *Shadows Into Light*, *Homemade Apple*, and vintage *Courier Prime* typewriter.
- **Ink Palette**: Midnight Blue fountain ink, Sepia Walnut, Charcoal Black, Burgundy Crimson, and Forest Pine.
- **Multi-Sensory Audio**: Keystroke audio synthesized via the Web Audio API (fountain pen scratching or typewriter clacks).
- **Line Snapping**: Option to automatically snap lines to the paper's ruling.

### 🎨 Scrapbooking & Doodling
- **Stylus & Freehand Sketching**: Switch to the Sketch tool to draw diagrams, underline words, or doodle in the margins with pressure sensitivity.
- **Polaroid Photos**: Pin instant Polaroid pictures with authentic white borders, washi tape, and handwritten captions. Includes client-side compression to avoid bloated storage.
- **Vintage Keepsakes**: Place embossed Burgundy wax seals, 1926 airmail cancellation stamps, dried autumn leaves, and coffee cup rings.

### 🌧️ Atmospheric Writing Environment
- **Ambient Soundscapes**: Synthesized gentle rain on window, crackling fireplace, or silence.
- **Desk Lighting Moods**: Warm desk lamp spotlight, soft morning daylight, or midnight candle mode.

### 🔒 Privacy-by-Design & Security First
- **Zero Latency & 100% Offline**: Powered by Dexie.js (IndexedDB). Your journal works 100% offline mid-flight without sending data over the network.
- **Zero Trackers & Zero Cookies**: No analytics, no marketing cookies, no third-party tracking scripts.
- **Edge Abuse Mitigation**: Built-in sliding-window rate limiting (60 req/min/IP) and 5 MB request size caps to stop abuse and denial-of-service.
- **Hardened HTTP Headers**: Pre-configured Content-Security-Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and HSTS.
- **Cryptographic User Isolation**: Optional Sync Passkey derives a SHA-256 partition ID, preventing cross-user data exposure on shared databases.
- **GDPR / CCPA Ready**: In-app Privacy & Security Center with a real-time Storage Auditor, one-click JSON Export, and permanent Data Wipe.

---

## 🚀 Quickstart & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Build & Lint
```bash
# Type check and production build
npm run build

# Code style and syntax check
npm run lint
```

---

## ☁️ Cloudflare Deployment Quick Reference

### Option A: Automatic Git Integration (Recommended)
1. Push your repository to GitHub or GitLab.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**!

### Option B: Wrangler CLI
```bash
# Log in to Cloudflare
npx wrangler login

# Deploy production build
npm run deploy
```

For complete instructions on Cloudflare D1 database setup and custom domain configuration, read [DEPLOYMENT.md](file:///d:/Projects/Journal/DEPLOYMENT.md).

---

## ⚙️ Environment Variables

Configure these in Cloudflare Dashboard under **Pages > Settings > Environment variables** or via `.env`:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `SYNC_SECRET` | string | *None* | Optional secret passkey required to access edge sync (`/api/sync`). |
| `RATE_LIMIT_PER_MINUTE` | number | `60` | Maximum allowable sync requests per minute per IP. |
| `D1_DATABASE_ID` | string | *None* | Cloudflare D1 database UUID for remote edge persistence. |

See [.env.example](file:///d:/Projects/Journal/.env.example) for a starter template.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Skeuomorphic Textures
- **Local Database**: Dexie.js (Browser IndexedDB)
- **Edge Runtime**: Cloudflare Pages, Cloudflare Pages Functions, Cloudflare D1 (Serverless SQLite)
- **Audio Synthesis**: Web Audio API (Zero audio assets or external streaming)
- **Icons**: Lucide React
- **Code Quality**: Oxlint, TypeScript Compiler
