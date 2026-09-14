# VitaNet — REST API Specification

All endpoints are versioned under `/api/v1` (except system health probes). Responses follow a consistent JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Detailed error explanation"
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 1. System Health

### `GET /health`
- **Auth**: None
- **Purpose**: Liveness probe for load balancers and Render health checks.
- **Response**: `{ "status": "ok", "uptime": 124.5 }`

### `GET /ready`
- **Auth**: None
- **Purpose**: Readiness probe checking MongoDB database connection state.
- **Response**: `{ "status": "ready", "database": "connected" }`

---

## 2. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `POST` | `/register` | Create new creator account | 3 / hour / IP | None |
| `POST` | `/login` | Authenticate with email/password | 5 / 15m / IP | None |
| `POST` | `/refresh` | Rotate access token via HttpOnly cookie | 120 / min | Cookie |
| `POST` | `/logout` | Revoke session & clear refresh cookie | 120 / min | Cookie |
| `POST` | `/verify-email` | Activate account with email token | 120 / min | None |
| `POST` | `/resend-verification`| Resend activation link | 5 / hour / IP | None |
| `POST` | `/forgot-password` | Request password reset token | 3 / hour / IP | None |
| `POST` | `/reset-password` | Reset password using token | 5 / hour / IP | None |
| `GET` | `/me` | Get current user profile | 120 / min | Bearer |
| `PATCH` | `/change-password` | Update password for authenticated user | 5 / hour | Bearer |

---

## 3. Users & Social Graph (`/api/v1/users`)

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `GET` | `/:username` | Retrieve creator public profile | 120 / min | Optional |
| `PATCH` | `/me` | Update display name, bio, avatar | 20 / min | Bearer |
| `GET` | `/me/export` | Download full JSON data archive | 5 / day | Bearer |
| `DELETE` | `/me` | Soft delete account & purge media | 3 / day | Bearer |
| `POST` | `/:userId/follow` | Follow a creator | 100 / hour | Bearer |
| `DELETE` | `/:userId/follow` | Unfollow a creator | 100 / hour | Bearer |
| `POST` | `/:userId/block` | Block account (bidirectional hide) | 30 / hour | Bearer |
| `DELETE` | `/:userId/block` | Unblock account | 30 / hour | Bearer |
| `POST` | `/:userId/mute` | Mute account (one-way silence) | 50 / hour | Bearer |
| `DELETE` | `/:userId/mute` | Unmute account | 50 / hour | Bearer |
| `GET` | `/:username/posts` | Cursor-paginated user post stream | 120 / min | Optional |
| `GET` | `/:username/followers` | Cursor-paginated followers list | 120 / min | Optional |
| `GET` | `/:username/following` | Cursor-paginated following list | 120 / min | Optional |

---

## 4. Media Pipeline (`/api/v1/media`)

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `POST` | `/presign-upload` | Validate quota and issue presigned PUT URL | 20 / hour | Bearer |
| `POST` | `/finalize-upload`| Verify R2 upload via S3 HEAD & record ledger | 20 / hour | Bearer |
| `POST` | `/download-batch` | Batch generate presigned GET URLs for feed | 120 / min | Bearer |
| `DELETE` | `/:id` | Mark media object for orphan cleanup | 30 / hour | Bearer |

---

## 5. Posts & Discussions (`/api/v1/posts`)

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `POST` | `/` | Publish new post referencing finalized media | 10 / day | Bearer |
| `GET` | `/:id` | Get single post details and media URLs | 120 / min | Bearer |
| `PATCH` | `/:id` | Edit post caption, tags, or content warning | 30 / hour | Bearer |
| `DELETE` | `/:id` | Soft delete post and trigger media cleanup | 20 / hour | Bearer |
| `POST` | `/:id/like` | Like a post (increments counter) | 300 / hour | Bearer |
| `DELETE` | `/:id/like` | Remove like | 300 / hour | Bearer |
| `POST` | `/:id/save` | Bookmark post to personal library | 100 / hour | Bearer |
| `DELETE` | `/:id/save` | Remove bookmark | 100 / hour | Bearer |
| `GET` | `/:id/comments` | Cursor-paginated comments for post | 120 / min | Bearer |
| `POST` | `/:id/comments` | Add comment to post | 60 / hour | Bearer |
| `DELETE` | `/:id/comments/:commentId` | Delete own comment | 60 / hour | Bearer |

---

## 6. Feed Discovery (`/api/v1/feed`)

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `GET` | `/following` | Reverse-chronological feed of followed users | 120 / min | Bearer |
| `GET` | `/explore` | Gravity-decay scored public discovery feed | 120 / min | Bearer |

---

## 7. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `GET` | `/` | Get activity notifications list | 120 / min | Bearer |
| `GET` | `/unread-count` | Lightweight counter probe for badges | 120 / min | Bearer |
| `POST` | `/mark-read` | Mark all notifications as read | 60 / min | Bearer |

---

## 8. Reports & Safety (`/api/v1/reports`)

| Method | Endpoint | Description | Rate Limit | Auth |
|--------|----------|-------------|------------|------|
| `POST` | `/` | Submit content or user moderation report | 20 / hour | Bearer |

---

## 9. Administrative Governance (`/api/v1/admin`)

*Requires user role `admin` or `moderator`.*

| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| `GET` | `/dashboard` | System health, capacity, and usage KPIs | Moderator/Admin |
| `GET` | `/reports` | Filtered list of community reports | Moderator/Admin |
| `PATCH` | `/reports/:id` | Resolve or dismiss moderation report | Moderator/Admin |
| `POST` | `/posts/:id/remove` | Force take down post with media cascade | Moderator/Admin |
| `GET` | `/users` | User management directory | Admin Only |
| `PATCH` | `/users/:id/status` | Suspend, ban, or restore user account | Admin Only |
| `GET` | `/usage` | Detailed per-user R2 media storage ledger | Moderator/Admin |
| `POST` | `/cleanup-orphans` | Trigger manual sweep of unreferenced R2 media | Admin Only |
