# VitaNet — Scaling & Migration Roadmap

How to transition VitaNet from the 100-user zero-cost MVP to higher scale tiers while preserving architectural boundaries.

---

## 1. Scale Transition Stages

| Tier | Active Users | Target Cost | Infrastructure Strategy |
|------|:------------:|:-----------:|-------------------------|
| **Stage 1 (Current)** | 100 | ₹0 / mo | M0 Free, R2 Free (7GB cap), Render Free, Brevo Free |
| **Stage 2** | 1,000 | ~$15 / mo | M0 / M2 Atlas, R2 Pay-as-you-go ($0.015/GB), Render Starter ($7/mo) |
| **Stage 3** | 10,000 | ~$75 / mo | M10 Atlas cluster, Cloudflare Images/R2, Render Team or Fly.io |
| **Stage 4** | 100,000+ | Scale | Dedicated MongoDB, Redis cache for feed fan-out, AWS S3 / R2 multi-region |

---

## 2. Transition Checklist: MVP → Stage 2 (1,000 Users)

1. **Adjust Constants**:
   - Update `GLOBAL_USER_CAP` in `server/src/config/constants.js` from `100` to `1000`.
   - Update `GLOBAL_MEDIA_CAP_BYTES` from `7 GB` to `75 GB`.
2. **Upgrade Render Web Service**:
   - Change Render instance type from `Free` to `Starter` ($7/month) to prevent 15-minute idle spin-down.
3. **Upgrade Brevo**:
   - If user activity exceeds 300 signups/verifications per day, upgrade Brevo to Starter ($9/month for 20,000 emails/month).
4. **Cloudflare R2 Billing**:
   - Enable pay-as-you-go billing on Cloudflare. Storage costs $0.015 per GB-month above 10 GB with zero egress fees.

---

## 3. Future Architectural Evolutions

- **Redis Feed Caching**: When user following graphs exceed 50,000 edges, introduce Redis for pre-computed chronological timelines.
- **Serverless Background Jobs**: Move `orphanCleanup.js` into a Cloudflare Worker scheduled via Cron Triggers.
