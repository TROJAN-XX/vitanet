# Deployment Guide: Render (Express API Web Service)

Render Free Tier hosts the VitaNet Express 5 backend web service.

---

## 1. Web Service Setup

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your Git repository (`vitanet`).
4. Configure service settings:
   - **Name**: `vitanet-api`
   - **Region**: Choose closest to your MongoDB Atlas cluster (e.g., `Ohio (US East)` or `Frankfurt (EU Central)`)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

---

## 2. Health Check Configuration

Render automatically pings health checks to ensure service readiness:
- **Health Check Path**: `/health`

---

## 3. Environment Variables

Add all required variables in the **Environment** tab:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render default) |
| `APP_ORIGIN` | `https://vitanet.pages.dev` |
| `COOKIE_SECRET` | 32-char cryptographically random hex |
| `JWT_ACCESS_SECRET` | 32-char cryptographically random hex |
| `JWT_REFRESH_SECRET` | 32-char cryptographically random hex |
| `MONGODB_URI` | Full connection string from Atlas M0 |
| `R2_ACCOUNT_ID` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | R2 S3 Token Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 S3 Token Secret Access Key |
| `R2_BUCKET_NAME` | `vitanet-media-prod` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile Secret Key |
| `BREVO_API_KEY` | Brevo API v3 Key |
| `BREVO_SENDER_EMAIL` | Verified sender address |
| `BREVO_SENDER_NAME` | `VitaNet` |
| `ADMIN_EMAIL` | Admin account bootstrap email |
| `ADMIN_USERNAME` | Admin account bootstrap username |
| `ADMIN_PASSWORD` | Admin account bootstrap password |

---

## 4. Spin-down Behavior Note

On Render Free tier, instances spin down after 15 minutes of inactivity. Initial requests after idle may take 30–50 seconds to warm up. VitaNet's client handles this gracefully with loading spinners and automatic request retries.
