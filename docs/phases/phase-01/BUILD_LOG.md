# Phase 1: Foundation — Build Log

**Date**: September 2026
**Status**: Complete

## What Was Built

### Root Files
- `.gitignore` — Node, env, build artifacts, IDE exclusions
- `.editorconfig` — 2-space indent, UTF-8, LF line endings
- `CONTRIBUTING.md` — Contributor guidelines
- `SECURITY.md` — Responsible disclosure policy
- `PRIVACY.md` — Privacy policy template (legal readiness)
- `TERMS.md` — Terms of service template
- `COMMUNITY_GUIDELINES.md` — Content and behavior rules
- `GRIEVANCE.md` — Grievance redressal per IT Act
- `CODE_OF_CONDUCT.md` — Contributor Covenant

### Server Foundation
| File | Purpose |
|------|---------|
| `package.json` | Express 5, Mongoose 8, security deps, AWS SDK for R2 |
| `.env.example` | All 20 required + 5 optional env vars documented |
| `src/config/env.js` | Zod-validated env — fails fast with clear errors |
| `src/config/constants.js` | All hard caps: 100 users, 7GB media, 75MB/user, rate limits |
| `src/utils/ApiError.js` | Custom error class with factory methods |
| `src/middleware/requestId.js` | UUID per request for tracing |
| `src/middleware/logger.js` | Structured JSON logging (no secrets) |
| `src/middleware/errorHandler.js` | Centralized error → `{success, error, requestId}` |
| `src/routes/health.js` | `GET /health` (liveness) + `GET /ready` (DB check) |
| `src/app.js` | Express + helmet + CORS allowlist + body limits |
| `src/server.js` | MongoDB connect + HTTP listen + graceful shutdown |
| `scripts/healthcheck.js` | Render health check script |

### Client Foundation
| File | Purpose |
|------|---------|
| `package.json` | React 19, react-router-dom 7, Vite 6, PWA plugin |
| `.env.example` | VITE_API_BASE_URL, VITE_TURNSTILE_SITE_KEY |
| `vite.config.js` | React plugin, dev proxy, vendor code splitting |
| `index.html` | SEO meta, Inter+Outfit fonts, PWA manifest |
| `src/index.css` | Complete dark-first design system |
| `src/main.jsx` | React entry with BrowserRouter + AuthProvider |
| `src/App.jsx` | Router shell with placeholder pages |
| `src/api/client.js` | Fetch wrapper with in-memory token + auto refresh |
| `src/contexts/AuthContext.jsx` | Auth state management |
| `public/manifest.json` | PWA manifest |
| `public/favicon.svg` | Gradient V lettermark |

### CI/CD
- `.github/workflows/ci.yml` — Server + Client parallel jobs: install, lint, test, build

## Design Decisions

1. **ESM everywhere**: Both server and client use `"type": "module"` for native ES modules
2. **Express 5**: Latest stable with built-in async error handling
3. **Mongoose 8**: Latest with improved TypeScript support and defaults
4. **In-memory access token**: Never stored in localStorage to prevent XSS theft
5. **Structured logging**: JSON log lines for easy parsing, never log secrets
6. **Low MongoDB pool**: `maxPoolSize: 5` to stay within Atlas Free limits
7. **Vendor code splitting**: React/router in separate chunk for better caching

## Constraints Validated
- ✅ No paid dependencies
- ✅ No multer/sharp/ffmpeg/socket.io/redis/bullmq/passport
- ✅ No secrets in frontend code
- ✅ JSON body limit (256kb) prevents abuse
- ✅ CORS strict allowlist
- ✅ Helmet security headers
- ✅ Trust proxy for Render
