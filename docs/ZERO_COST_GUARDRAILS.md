# VitaNet — Zero-Cost Infrastructure Guardrails

VitaNet is engineered to maintain ₹0 recurring hosting, storage, and computing expenses indefinitely. Every architectural component maps to a specific free-tier boundary and is protected by hard application-level caps.

---

## 1. Free-Tier Budget Mapping

| Service | Provider | Free Tier Limit | VitaNet Enforcement Mechanism |
|---------|----------|-----------------|-------------------------------|
| **Database** | MongoDB Atlas M0 | 512 MB storage, 500 connections | Strict schema hygiene; no binaries; connection pool capped at `maxPoolSize: 5` |
| **Media Storage** | Cloudflare R2 | 10 GB storage, 1M Class A ops | Hard platform cap at 7 GB; per-user quota at 75 MB; client-side image downscaling |
| **Edge Delivery** | Cloudflare Pages | Unlimited bandwidth & requests | Static SPA assets cached on global CDN; SPA client routing |
| **Bot Deterrence**| Cloudflare Turnstile | Free managed tier | Turnstile token required on register, login, and password resets |
| **API Compute** | Render Free | 512 MB RAM, ephemeral disk | Zero media bytes streamed through Express; in-memory sessions; 256 KB JSON body limit |
| **Email Service** | Brevo Free | 300 emails/day | Application-level counter in `emailService.js` prevents exceeding 300 emails/day |

---

## 2. Hard Constants Reference (`server/src/config/constants.js`)

```javascript
export const GLOBAL_USER_CAP = 100;                                   // Max 100 accounts
export const GLOBAL_MEDIA_CAP_BYTES = 7 * 1024 * 1024 * 1024;        // 7 GB global cap
export const PER_USER_MEDIA_QUOTA_BYTES = 75 * 1024 * 1024;           // 75 MB per creator
export const BREVO_DAILY_LIMIT = 300;                                 // 300 emails/day
export const JSON_BODY_LIMIT = '256kb';                               // Blocks payload flooding
```

---

## 3. Mathematical Quota Proof

- **Maximum Allowed Accounts**: $N = 100$.
- **Per-User Media Quota**: $Q_{\text{user}} = 75 \text{ MB}$.
- **Maximum Storage Footprint**:
  $$S_{\text{max}} = 100 \times 75 \text{ MB} = 7,500 \text{ MB} \approx 7.32 \text{ GB}$$
- Because $S_{\text{max}} \le 10 \text{ GB}$ (Cloudflare R2 Free Allocation), it is mathematically impossible for user media to exceed the zero-cost threshold.

---

## 4. Operational Emergency Playbook

If storage approaches the 7 GB global cap:
1. The supervisory console warns administrators at `/admin/dashboard`.
2. The system automatically rejects subsequent presigned upload requests with HTTP `403 FORBIDDEN (QUOTA_EXCEEDED)`.
3. Administrators run **Orphan Media Cleanup** via `/admin/usage` or trigger soft-deletion of inactive test accounts.
