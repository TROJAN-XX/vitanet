# Deployment Guide: Cloudflare Turnstile

Cloudflare Turnstile provides seamless, non-intrusive CAPTCHA replacement to protect registration, login, and password recovery from automated bot spam.

---

## 1. Widget Creation

1. In Cloudflare Dashboard, select **Turnstile** from the sidebar.
2. Click **Add site**.
3. **Site name**: `VitaNet Production`.
4. **Domain**:
   - `vitanet.pages.dev`
   - `localhost` (for local development)
   - Add your custom domain if applicable.
5. **Widget Mode**: `Managed` (Cloudflare chooses the most effective frictionless challenge).
6. Click **Create**.

---

## 2. API Keys

After creation, copy the two keys:
1. **Site Key** (Public): `0x4AAAAAA...`
   - Configured in `client/.env` as `VITE_TURNSTILE_SITE_KEY`.
2. **Secret Key** (Private): `0x4AAAAAA...`
   - Configured in `server/.env` as `TURNSTILE_SECRET_KEY`.

---

## 3. Development Fallback

If `TURNSTILE_SECRET_KEY` is not provided in development, the backend middleware in `server/src/middleware/turnstile.js` automatically permits requests. When configured in production, every submission is validated with `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`.
