# VitaNet — System Architecture & Design

VitaNet is an independent, non-corporate creator network designed from first principles to operate indefinitely at ₹0 recurring infrastructure cost for a curated community of 100 creators.

---

## 1. High-Level Architecture Topology

```mermaid
graph TD
    subgraph "Client Layer (Cloudflare Pages)"
        SPA["React 19 + Vite PWA<br/>SPA on Global Edge CDN"]
        CanvasEngine["In-Browser Canvas Engine<br/>Downscaling & EXIF Stripping"]
    end

    subgraph "API Layer (Render Free Web Service)"
        ExpressApp["Express 5 REST API<br/>Stateless, Ephemeral Memory"]
        AuthMiddleware["Security & JWT Engine<br/>In-Memory Access / HttpOnly Refresh"]
        QuotaEngine["Quota & Guardrail Enforcement<br/>75MB User / 7GB Global / 100 Users"]
    end

    subgraph "Storage & Edge Infrastructure"
        MongoDB["MongoDB Atlas Free (M0)<br/>Metadata, Documents, Relational Graph"]
        R2Bucket["Cloudflare R2 (Private Bucket)<br/>Direct Presigned PUT / GET Storage"]
    end

    subgraph "Auxiliary Managed Services"
        Turnstile["Cloudflare Turnstile<br/>Frictionless Bot & Sybil Deterrence"]
        Brevo["Brevo Free API<br/>Transactional Email (300/day cap)"]
    end

    SPA -->|1. Render & Authenticate| ExpressApp
    SPA -->|2. Canvas Optimize Media| CanvasEngine
    CanvasEngine -->|3. Request Presigned PUT| ExpressApp
    ExpressApp -->|4. Verify 75MB Quota| QuotaEngine
    QuotaEngine -->|5. Issue Signed PUT URL| R2Bucket
    CanvasEngine -->|6. Direct Binary Upload| R2Bucket
    SPA -->|7. Finalize (HEAD check)| ExpressApp
    ExpressApp -->|8. Store Metadata Only| MongoDB
    ExpressApp -->|9. Dispatch Emails| Brevo
    SPA -->|10. Challenge Token| Turnstile
```

---

## 2. Core Architectural Principles

### Zero Media Through API Compute
Render's free tier provides 512 MB RAM and shared CPU. Streaming or transcoding file uploads inside Node.js processes leads to out-of-memory (OOM) crashes, socket timeouts, and bandwidth throttling. 

VitaNet solves this by entirely detaching file binaries from Express:
- The browser resizes images to a maximum 1920×1080 resolution and strips EXIF tags via HTML5 Canvas.
- The server generates short-lived presigned PUT URLs (10-minute validity) directly to Cloudflare R2.
- The client uploads binaries directly to Cloudflare R2 over HTTPS.
- Upon completion, the server performs an AWS S3 `HeadObjectCommand` to verify byte size before acknowledging the media record.

### Private Bucket Architecture
Cloudflare R2's public `r2.dev` bucket access is permanently disabled. Media viewing is mediated via signed GET URLs with a 15-minute expiration window attached dynamically to feed responses. This eliminates hotlinking, unauthorized scraping, and unmetered access.

### Strict Identity & Token Separation
- **Access Tokens**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`, stored exclusively in application memory (never in `localStorage` or `sessionStorage`).
- **Refresh Tokens**: Long-lived (30 days), stored in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie. Stored in MongoDB as SHA-256 hashes (`tokenHash`). Every refresh rotates the token and detects reuse attempts.

---

## 3. Component Directory Structure

```
vitanet/
├── client/                     # Frontend React 19 Application
│   ├── src/
│   │   ├── api/client.js       # Fetch wrapper with auto token refresh
│   │   ├── components/
│   │   │   ├── auth/           # Route guards & Turnstile widget
│   │   │   ├── layout/         # TopBar, BottomNav, AppShell
│   │   │   ├── media/          # UploadDropzone, MediaPreview
│   │   │   ├── moderation/     # ReportModal
│   │   │   ├── posts/          # PostCard, MediaCarousel, CommentDrawer
│   │   │   ├── profile/        # ProfileHeader, EditProfile, UserList
│   │   │   └── ui/             # ToastContainer, Modal, ErrorBoundary
│   │   ├── contexts/           # AuthContext, ToastContext
│   │   ├── hooks/              # useMediaUpload (Canvas engine)
│   │   ├── pages/              # Auth, Feed, Profile, Admin, Settings, Legal
│   │   ├── index.css           # Custom dark-first design system
│   │   └── main.jsx            # Application entry
│   └── vite.config.js          # PWA plugin & code-splitting
├── server/                     # Backend Express 5 REST API
│   ├── src/
│   │   ├── config/             # Zod validated env & hard constants
│   │   ├── controllers/        # Route controllers
│   │   ├── jobs/               # Orphan media cleanup reconciler
│   │   ├── middleware/         # Auth, CSRF, Rate limits, Turnstile, Logs
│   │   ├── models/             # 15 Mongoose schemas with indexes
│   │   ├── routes/             # Express 5 route modules
│   │   ├── services/           # R2 presigner, Quota ledger, Brevo, Tokens
│   │   └── server.js           # Database connect & HTTP listener
│   └── tests/                  # Jest test suites (quota, scoring, validation)
└── docs/                       # Comprehensive documentation suite
```
