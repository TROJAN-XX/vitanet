# VitaNet — Database Architecture & Schema Reference

VitaNet uses MongoDB Atlas M0 Free Tier strictly for metadata, relational graph edges, and structured interaction records. **No binaries, file streams, or base64 blobs are ever stored in MongoDB.**

---

## 1. Indexing Strategy & Performance

To guarantee constant-time queries without triggering Atlas memory alerts or full collection scans:
- Every relational query utilizes compound equality/range indexes.
- Transient documents (`Session`, `EmailToken`, `UploadSession`) use MongoDB TTL indexes for automated zero-cost expiration.
- Identity lookups query lowercased normalized fields (`usernameNormalized`, `emailNormalized`) backed by unique sparse indexes.

---

## 2. Collection Schemas (All 15 Models)

### `User`
- **Fields**: `username`, `usernameNormalized`, `email`, `emailNormalized`, `passwordHash`, `displayName`, `bio`, `avatarMediaId`, `accountStatus` (`pending_verification`, `active`, `suspended`, `banned`, `deleted`), `role` (`user`, `moderator`, `admin`), `isEmailVerified`, `followersCount`, `followingCount`, `postsCount`, `lastLoginAt`, `deletedAt`.
- **Indexes**:
  - `{ usernameNormalized: 1 }` (unique)
  - `{ emailNormalized: 1 }` (unique)
  - `{ accountStatus: 1 }`
  - `{ createdAt: -1 }`

### `Session`
- **Fields**: `userId`, `tokenHash` (SHA-256), `ipAddress`, `userAgent`, `expiresAt`, `revokedAt`.
- **Indexes**:
  - `{ tokenHash: 1 }` (unique)
  - `{ userId: 1, revokedAt: 1 }`
  - `{ expiresAt: 1 }` (TTL: 30 days)

### `EmailToken`
- **Fields**: `userId`, `tokenHash`, `type` (`verify_email`, `reset_password`), `expiresAt`, `consumedAt`.
- **Indexes**:
  - `{ tokenHash: 1 }` (unique)
  - `{ expiresAt: 1 }` (TTL: 24 hours)

### `Post`
- **Fields**: `authorId`, `caption`, `media` (`[{ mediaId, objectKey, byteSize, mimeType, width, height }]`), `contentWarning`, `topics`, `visibility` (`public`, `followers_only`), `likeCount`, `saveCount`, `commentCount`, `exploreScore`, `deletedAt`.
- **Indexes**:
  - `{ authorId: 1, createdAt: -1 }`
  - `{ exploreScore: -1, createdAt: -1 }`
  - `{ topics: 1 }`
  - `{ deletedAt: 1 }`

### `Follow`
- **Fields**: `followerId`, `followingId`.
- **Indexes**:
  - `{ followerId: 1, followingId: 1 }` (unique compound)
  - `{ followingId: 1 }`

### `Like`
- **Fields**: `userId`, `postId`.
- **Indexes**:
  - `{ userId: 1, postId: 1 }` (unique compound)
  - `{ postId: 1 }`

### `Save`
- **Fields**: `userId`, `postId`.
- **Indexes**:
  - `{ userId: 1, postId: 1 }` (unique compound)
  - `{ userId: 1, createdAt: -1 }`

### `Comment`
- **Fields**: `postId`, `authorId`, `body`, `deletedAt`.
- **Indexes**:
  - `{ postId: 1, createdAt: -1 }`
  - `{ authorId: 1 }`

### `Block`
- **Fields**: `blockerId`, `blockedId`.
- **Indexes**:
  - `{ blockerId: 1, blockedId: 1 }` (unique compound)
  - `{ blockedId: 1 }`

### `Mute`
- **Fields**: `muterId`, `mutedId`.
- **Indexes**:
  - `{ muterId: 1, mutedId: 1 }` (unique compound)

### `Report`
- **Fields**: `reporterId`, `targetType` (`post`, `comment`, `user`), `targetId`, `reason`, `details`, `status` (`pending`, `resolved`, `dismissed`), `resolution`, `resolvedBy`, `notes`.
- **Indexes**:
  - `{ status: 1, createdAt: -1 }`
  - `{ targetType: 1, targetId: 1 }`

### `Notification`
- **Fields**: `recipientId`, `actorId`, `type` (`like`, `comment`, `follow`), `postId`, `commentId`, `isRead`.
- **Indexes**:
  - `{ recipientId: 1, isRead: 1 }`
  - `{ recipientId: 1, createdAt: -1 }`

### `AuditEvent`
- **Fields**: `actorUserId`, `action`, `targetType`, `targetId`, `details`, `ipAddress`, `userAgent`.
- **Indexes**:
  - `{ actorUserId: 1, createdAt: -1 }`
  - `{ action: 1, createdAt: -1 }`

### `MediaUsage`
- **Fields**: `userId`, `objectKey`, `byteSize`, `mimeType`, `purpose`, `status` (`uploading`, `completed`, `pending_delete`, `deleted`).
- **Indexes**:
  - `{ objectKey: 1 }` (unique)
  - `{ userId: 1, status: 1 }`
  - `{ status: 1 }`

### `UploadSession`
- **Fields**: `userId`, `uploadToken`, `objectKey`, `requestedBytes`, `mimeType`, `purpose`, `status` (`pending`, `completed`, `expired`, `failed`), `expiresAt`.
- **Indexes**:
  - `{ uploadToken: 1 }` (unique)
  - `{ expiresAt: 1 }` (TTL: 15 minutes)
