# Deployment Guide: Cloudflare Pages (Frontend Client)

VitaNet's React 19 client is hosted on Cloudflare Pages, providing global edge CDN delivery, automatic SSL, and unlimited bandwidth at ₹0 cost.

---

## 1. Project Setup

1. In Cloudflare Dashboard, select **Workers & Pages** → **Create application** → **Pages** tab.
2. Click **Connect to Git**.
3. Select the `vitanet` repository.
4. Set build settings:
   - **Project Name**: `vitanet`
   - **Production Branch**: `main`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
   - **Node.js Version**: `22` (Set environment variable `NODE_VERSION=22`)

---

## 2. Environment Variables

Under **Settings** → **Environment variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://vitanet-api.onrender.com/api/v1` |
| `VITE_TURNSTILE_SITE_KEY` | `0x4AAAAAA...` (From Turnstile Dashboard) |

---

## 3. SPA Routing & Redirects

Cloudflare Pages automatically reads `client/public/_redirects`:
```text
/*    /index.html   200
```
This ensures direct URLs (e.g., `/u/alice`, `/p/123`, `/settings`) resolve correctly through the client router rather than triggering 404s.

---

## 4. Custom Domain (Optional)

1. Navigate to **Custom Domains** in Pages project.
2. Click **Set up a custom domain**.
3. Enter your apex domain or subdomain (e.g., `vitanet.social`).
4. Cloudflare provisions and manages SSL certificates automatically.
