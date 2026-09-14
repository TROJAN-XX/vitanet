# VitaNet — Troubleshooting & Incident Guide

Solutions to common errors, edge conditions, and environment configuration issues.

---

## 1. Cloudflare R2 Upload CORS Failures

**Symptom**: Browser console displays `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://...r2.cloudflarestorage.com`.

**Root Cause**: The R2 bucket does not have a CORS policy allowing `PUT` from your web app domain.

**Fix**:
1. Open Cloudflare Dashboard → R2 → `vitanet-media-prod` → **Settings** → **CORS Policy**.
2. Ensure your origin (`https://vitanet.pages.dev` or `http://localhost:5173`) is listed in `AllowedOrigins`.
3. Ensure `PUT`, `GET`, and `HEAD` are included in `AllowedMethods`.

---

## 2. Render Free Tier Cold Starts

**Symptom**: The first API call takes 30–50 seconds after a period of inactivity.

**Root Cause**: Render Free tier spins down web services after 15 minutes of zero traffic.

**Remedy**:
- The client UI handles this by displaying accessible loading indicators (`.spinner`) and retaining application state.
- For production, keep the service warm using a cron health check (e.g. UptimeRobot or GitHub Actions pinging `GET /health` every 14 minutes).

---

## 3. Cloudflare Turnstile In Local Development

**Symptom**: Turnstile widget fails with `Invalid site key` error.

**Root Cause**: `VITE_TURNSTILE_SITE_KEY` is not added to Cloudflare domain allowlist or is an invalid mock.

**Remedy**:
- In `client/.env`, set `VITE_TURNSTILE_SITE_KEY=0x0000000000000000000000`.
- VitaNet's `TurnstileWidget.jsx` detects this mock placeholder and automatically enables local bypass mode.

---

## 4. MongoDB M0 Connection Timeouts

**Symptom**: Server logs `MongoServerSelectionError: connection timed out`.

**Root Cause**: MongoDB Atlas IP Access List does not allow connections from Render dynamic IPs.

**Remedy**:
- In Atlas → Network Access, add `0.0.0.0/0` (Allow access from anywhere).
- Ensure `maxPoolSize: 5` is set in Mongoose options to avoid connection exhaustion.
