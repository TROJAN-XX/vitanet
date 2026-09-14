# VitaNet — Production Operations & Maintenance Runbook

Operational procedures, monitoring runbooks, and administration routines for maintaining VitaNet.

---

## 1. Health Checks & Synthetic Monitoring

The API server exposes two automated health endpoints:
- `GET /health`: Liveness probe. Returns HTTP `200` with uptime and memory metrics.
- `GET /ready`: Readiness probe. Pings MongoDB connection state (`mongoose.connection.readyState === 1`). Returns HTTP `503` if the database is disconnected.

---

## 2. Structured Logging & Secret Redaction

Logging is centralized via `server/src/middleware/logger.js`.
- Outputs single-line JSON format compatible with Render and external log collectors.
- Automatically redacts authorization headers, password hashes, cookies, and tokens.
- Generates a unique UUID v4 `X-Request-Id` for tracing every HTTP round-trip.

---

## 3. Administrator Account Bootstrap

To provision or elevate an administrator account, run the CLI utility:

```bash
cd server
npm run seed:admin
```

This reads `ADMIN_EMAIL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` from `.env`, hashes the password with bcrypt (12 rounds), and updates the database record idempotently.

---

## 4. Manual Database Backup Procedure

Using `mongodump` with Atlas M0:

```bash
mongodump --uri="mongodb+srv://vitanet_app:<password>@vitanet-cluster.xxxxx.mongodb.net/vitanet" --out=./backups/$(date +%Y%m%d)
```
