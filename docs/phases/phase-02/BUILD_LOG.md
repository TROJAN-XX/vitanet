# Phase 2: Auth & Database — Build Log

**Date**: September 2026
**Status**: Complete

## What Was Built

### Mongoose Models (All 15 Collections)
| File | Purpose | Key Indexes |
|------|---------|-------------|
| `src/models/User.js` | User identity, credentials, roles, bio, quotas | Unique `normalizedUsername`, unique `normalizedEmail`, `role`, `status` |
| `src/models/Session.js` | Refresh token hash storage with IP & User-Agent | Unique `tokenHash`, TTL `expiresAt` (30 days) |
| `src/models/EmailToken.js` | Email verification & password reset tokens | Unique `tokenHash`, TTL `expiresAt` (24h) |
| `src/models/Post.js` | Post metadata, media references, metrics, content warning | `authorId + createdAt`, `exploreScore`, `topics` |
| `src/models/Follow.js` | Follow graph edge | Unique `followerId + followingId`, `followingId` |
| `src/models/Like.js` | Post like interaction | Unique `userId + postId`, `postId` |
| `src/models/Save.js` | Bookmarked posts | Unique `userId + postId`, `postId` |
| `src/models/Comment.js` | Post comments with parent post link | `postId + createdAt`, `authorId` |
| `src/models/Block.js` | User blocking edge | Unique `blockerId + blockedId`, `blockedId` |
| `src/models/Mute.js` | User muting edge | Unique `muterId + mutedId` |
| `src/models/Report.js` | Content and user moderation reports | `targetType + targetId`, `status + createdAt` |
| `src/models/Notification.js` | User notifications (like, follow, comment) | `recipientId + isRead`, `recipientId + createdAt` |
| `src/models/AuditEvent.js` | Immutable administrative & security audit trail | `actorId`, `action + createdAt` |
| `src/models/MediaUsage.js` | Active media accounting per user and R2 object | Unique `objectKey`, `userId + status`, `status` |
| `src/models/UploadSession.js` | Ephemeral pre-upload token before finalize | Unique `uploadToken`, TTL `expiresAt` (15 mins) |
| `src/models/index.js` | Central barrel export for all models | — |

### Security & Validation Middleware
| File | Purpose |
|------|---------|
| `src/middleware/auth.js` | `requireAuth` (verifies access token JWT), `requireRole` (admin/moderator check), `optionalAuth` |
| `src/middleware/rateLimiter.js` | `signupLimiter` (3/hr per IP), `loginLimiter` (5/15m per IP), `passwordResetLimiter` (3/hr per IP), `generalLimiter` |
| `src/middleware/turnstile.js` | Cloudflare Turnstile token validation against `challenges.cloudflare.com` |
| `src/middleware/csrf.js` | Origin validation against allowlist + CSRF token header check |

### Services & Controllers
| File | Purpose |
|------|---------|
| `src/services/emailService.js` | Brevo API transactional mailer with hard 300 emails/day application counter |
| `src/services/tokenService.js` | Access token JWT (15m), refresh token generation (30d), SHA-256 session hashing |
| `src/controllers/authController.js` | Register, verify email, resend verification, login, refresh, logout, forgot/reset password, change password, getMe |
| `src/routes/auth.js` | Auth endpoints wired with rate limiters and Turnstile middleware (including PATCH /change-password) |

## Design Decisions

1. **Strict 100-User Hard Cap**: Registration checks `User.countDocuments({ status: { $ne: 'deleted' } }) >= GLOBAL_USER_CAP` before proceeding, strictly enforcing infrastructure zero-cost limits.
2. **In-Memory Access Token + HttpOnly Refresh Token**: Access token has a short 15-minute lifespan and is never stored in localStorage to prevent XSS exfiltration. Refresh tokens are stored in an HttpOnly, SameSite cookie and hashed with SHA-256 in MongoDB.
3. **Turnstile Bot Prevention**: Protects register, login, and password reset endpoints from brute force and automated spam while keeping user experience frictionless.
4. **Brevo Application-Level Cap**: In-memory and daily database tracking prevents accidental overages beyond the 300 free emails/day limit.
5. **Session Revocation on Rotation**: Every refresh rotates the refresh token and detects reuse attempts to prevent token replay attacks.

## Constraints Validated
- ✅ 100-user hard cap enforced on `/register`
- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ Refresh tokens hashed with SHA-256 in MongoDB
- ✅ TTL indexes automatically purge expired sessions and email tokens
- ✅ No plaintext secrets stored or logged
