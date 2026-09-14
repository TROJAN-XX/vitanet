# VitaNet — Independent Creator Network

[![CI](https://github.com/vitanet/vitanet/actions/workflows/ci.yml/badge.svg)](https://github.com/vitanet/vitanet/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Cost Guaranteed](https://img.shields.io/badge/%E2%82%B90-Infrastructure-00d4aa.svg)](docs/ZERO_COST_GUARDRAILS.md)

**VitaNet** is an independent, non-corporate photo/video social platform designed from first principles to host a curated community of **100 creators at ₹0 recurring infrastructure cost**. Built with a custom dark-first design system, native PWA capabilities, transparent ranking algorithms, and statutory legal readiness (DPDP Act 2023, IT Act, and GDPR).

---

## 🌟 Key Features

- **Strictly Chronological Following Feed**: No opaque engagement algorithms, algorithmic suppression, or intrusive ads.
- **Transparent Community Explore Feed**: Public posts ranked via a documented, open gravity decay formula:
  $$\text{Score} = \frac{2 \times \text{likes} + 3 \times \text{saves} + 2 \times \text{comments} + 1}{(\text{ageInHours} + 2)^{1.2}}$$
- **Zero Media Bytes Through Express**: Client-side canvas engine automatically scales images (max 1920×1080) and strips all EXIF/GPS tags in-browser, uploading directly to private Cloudflare R2 via presigned PUT URLs.
- **Exclusive Platform Capacity Guardrail**: Hard platform cap of 100 member accounts and 75 MB per-creator media quota, mathematically guaranteeing ₹0 infrastructure expenditure.
- **Defense-in-Depth Safety & Moderation**: User-flagged reports, staff triage queue, automated orphan media cleanup, and immutable audit event logging.
- **Digital Sovereignty & Data Portability**: Full GDPR Article 20 / DPDP machine-readable JSON data export and irreversible account erasure.

---

## 🏗️ Architecture & Zero-Cost Stack

| Component | Technology | Provider | Cost |
|-----------|------------|----------|------|
| **Frontend PWA** | React 19, React Router 7, Vite 6 | Cloudflare Pages | ₹0 (Unlimited Bandwidth) |
| **API Server** | Express 5, Mongoose 8, Zod, ESM | Render Free Web Service | ₹0 (512MB RAM) |
| **Media Storage** | Cloudflare R2 (Private S3 API) | Cloudflare R2 | ₹0 (10GB Free, 7GB Cap) |
| **Database** | MongoDB Atlas M0 Cluster | MongoDB Atlas | ₹0 (512MB Free) |
| **Bot Deterrence** | Cloudflare Turnstile | Cloudflare | ₹0 (Free Tier) |
| **Transactional Mail** | Brevo v3 REST API | Brevo Free | ₹0 (300 emails/day cap) |

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js ≥ 22.0.0
- npm ≥ 10.0.0

### 1. Repository Setup
```bash
git clone https://github.com/vitanet/vitanet.git
cd vitanet
```

### 2. Backend Server
```bash
cd server
npm ci
cp .env.example .env
# Fill in MONGODB_URI, R2 credentials, Brevo API key, and secrets in .env
npm run dev
```

### 3. Frontend Client
```bash
cd ../client
npm ci
cp .env.example .env
npm run dev
```
Open `http://localhost:5173` to experience VitaNet.

### 4. Running Automated Tests & Linting
```bash
# Server tests (14 unit tests across quota, scoring, and validation)
cd server
npm test
npm run lint

# Client production build & lint
cd ../client
npm run build
npm run lint
```

---

## 📚 Complete Documentation Suite

VitaNet is fully documented across all architectural, operational, and regulatory aspects:

- [System Architecture](docs/ARCHITECTURE.md) — System topology, data flow, and separation of concerns.
- [REST API Specification](docs/API.md) — Comprehensive OpenAPI-style guide for all 9 route modules.
- [Database Schema Reference](docs/DATABASE.md) — Documentation of all 15 Mongoose collections and index specs.
- [Media Pipeline](docs/MEDIA_PIPELINE.md) — In-browser canvas optimization, direct R2 presigned URLs, and orphan sweeps.
- [Zero-Cost Guardrails](docs/ZERO_COST_GUARDRAILS.md) — Mathematical budget proofs and free-tier boundaries.
- [Moderation & Safety](docs/MODERATION.md) — Triage queue, content takedown cascades, and staff role matrices.
- [Production Operations](docs/OPERATIONS.md) — Monitoring runbook, logging, and administrative routines.
- [Backup & Disaster Recovery](docs/BACKUP_AND_RECOVERY.md) — Database snapshots and disaster recovery protocol.
- [Scaling & Migration Roadmap](docs/MIGRATION_AND_SCALE.md) — Cost projections and evolution paths beyond 100 users.
- [Legal Compliance Framework](docs/LEGAL_READINESS.md) — DPDP Act 2023, IT Intermediary Rules, and GDPR compliance.
- [Troubleshooting Runbook](docs/TROUBLESHOOTING.md) — Diagnosis and fixes for common operational edge cases.

### Phase Build Logs
- [Phase 1: Foundation](docs/phases/phase-01/BUILD_LOG.md)
- [Phase 2: Auth & Database](docs/phases/phase-02/BUILD_LOG.md)
- [Phase 3: Media Pipeline](docs/phases/phase-03/BUILD_LOG.md)
- [Phase 4: Social Graph](docs/phases/phase-04/BUILD_LOG.md)
- [Phase 5: Posts & Feed](docs/phases/phase-05/BUILD_LOG.md)
- [Phase 6: Moderation & Admin](docs/phases/phase-06/BUILD_LOG.md)
- [Phase 7: PWA & Client Shell](docs/phases/phase-07/BUILD_LOG.md)
- [Phase 8: Privacy & Settings](docs/phases/phase-08/BUILD_LOG.md)
- [Phase 9: Deployment & Automation](docs/phases/phase-09/BUILD_LOG.md)
- [Phase 10: Hardening & Testing](docs/phases/phase-10/BUILD_LOG.md)

---

## 📜 License & Governance

- Released under the [MIT License](LICENSE).
- Governed by the [Community Guidelines](COMMUNITY_GUIDELINES.md), [Privacy Policy](PRIVACY.md), and [Terms of Service](TERMS.md).
- Statutory grievances addressed via the [Grievance Redressal Mechanism](GRIEVANCE.md).
