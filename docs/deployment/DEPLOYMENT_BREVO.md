# Deployment Guide: Brevo (Transactional Email)

VitaNet sends transactional emails (verification links, password reset tokens) via the Brevo Free API tier (300 emails/day cap).

---

## 1. Brevo Account Setup

1. Sign up for a free account at [Brevo (formerly Sendinblue)](https://www.brevo.com/).
2. Verify your administrative identity.

---

## 2. Sender Identity Verification

1. In Brevo Dashboard, navigate to **Senders, Domains & Dedicated IPs**.
2. Click **Add a Sender**.
3. **Sender Name**: `VitaNet`.
4. **Email Address**: Your verified custom domain address (e.g. `noreply@yourdomain.com`) or a verified administrative address.
5. Confirm verification link sent to your inbox.

---

## 3. Generate API Key

1. Click on your profile menu in the upper right → **SMTP & API**.
2. Under **API Keys**, click **Generate a new API key**.
3. **Key Name**: `vitanet-api-server`.
4. Copy the secret key (`xkeysib-...`).

---

## 4. Environment Variables

Set in `server/.env` and Render dashboard:

```env
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=VitaNet
```

---

## 5. Daily Quota Guardrails

VitaNet includes an internal in-memory and daily database counter in `server/src/services/emailService.js`. If the 300 emails/day threshold is approached, the system logs a high-priority alert and throttles non-critical notifications to ensure zero accidental overage costs.
