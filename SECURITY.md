# Security Policy & Architecture

The Chronicle team takes website security, abuse prevention, and the confidentiality of private journals with the utmost seriousness. This document outlines our threat model, defensive controls, and vulnerability disclosure policy.

---

## 🛡️ Supported Versions

Only the current version on the `main` branch is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

---

## 🔒 Security Architecture & Defensive Controls

Chronicle implements defense-in-depth across the client browser, edge network, and serverless runtime.

### 1. Website Abuse & Denial of Service (DoS) Mitigation
- **Edge Rate Limiting**: The serverless edge functions (`functions/_middleware.ts`) enforce in-memory sliding-window rate limiting per IP (default: 60 requests per minute). Exceeding clients receive HTTP `429 Too Many Requests` with a `Retry-After` header.
- **Payload Size Caps**: Requests exceeding 5 MB in body size are immediately rejected with HTTP `413 Payload Too Large` before parsing, preventing edge memory exhaustion and database denial-of-service.
- **Batch Processing Caps**: The `/api/sync` endpoint caps batch submissions to a maximum of 200 pages per request.
- **Cloudflare Layer 7 Protection**: When hosted on Cloudflare Pages, DDoS mitigation and Bot Fight Mode filter out volumetric attacks and automated scanners before reaching execution layers.

### 2. Cross-Site Scripting (XSS) & Injection Prevention
- **Content Security Policy (CSP)**: Delivered via HTTP response headers on all requests:
  - Scripts restricted to `'self'`.
  - Styles restricted to `'self'`, inline styles, and Google Fonts (`fonts.googleapis.com`).
  - Fonts restricted to Google Fonts CDN (`fonts.gstatic.com`) and local data URIs.
  - Media and connect restricted strictly to `'self'`, Unsplash, and secure endpoints.
  - Disallows plugins and objects: `object-src 'none'`.
- **Strict Protocol Validation**: Image insertion (`AddPhotoModal.tsx`) strictly validates input protocols. Only secure web URLs (`https://`, `http://`) and standard base64 image data URIs (`data:image/(jpeg|png|webp|gif|avif);base64,...`) are accepted. Potentially malicious schemes (`javascript:`, `vbscript:`, `file:`) are blocked.
- **Safe React DOM Sanitization**: All handwriting, text blocks, and captions are rendered as text content nodes via React, avoiding raw `dangerouslySetInnerHTML`.

### 3. Clickjacking & MIME-Sniffing Defenses
- **`X-Frame-Options: DENY`**: Prevents Chronicle from being embedded in `<iframe>`, `<frame>`, or `<object>` elements on external domains, eliminating UI redressing and clickjacking threats.
- **`frame-ancestors 'none'`**: Reinforced via CSP Level 2/3.
- **`X-Content-Type-Options: nosniff`**: Forces browsers to respect declared MIME types, preventing executable code disguised as images or text.

### 4. Zero Information Leakage
- Edge functions intercept database or runtime exceptions. Internal SQLite errors, table schema definitions, and stack traces are suppressed from client responses and replaced with generic error codes (`INTERNAL_SERVER_ERROR`, `SYNC_FAILED`).

### 5. Authorization & Cryptographic Partitioning
- **Sync Passkey Protection**: Access to the remote synchronization endpoint (`/api/sync`) can be locked with a private passkey (`SYNC_SECRET`).
- **Cryptographic Partitioning**: When a user configures a personal passkey, Chronicle derives an isolated journal identifier using `SHA-256` digest hashing, ensuring that different passkeys cannot access or overwrite other journal partitions on the same database.

### 6. Transport Security
- **HTTP Strict Transport Security (HSTS)**:
  `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  Forces HTTPS connections for 1 year, protecting against man-in-the-middle (MITM) attacks and protocol downgrade attempts.
- **Permissions Policy**: Restricts unused hardware capabilities:
  `camera=(), microphone=(), geolocation=(), payment=(), usb=()`

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within Chronicle:

1. **Do not open a public issue.**
2. Send a detailed description of the vulnerability, reproduction steps, and potential impact to the repository maintainer via private message or email.
3. We will acknowledge receipt within 48 hours and work with you on a coordinated fix and disclosure.
