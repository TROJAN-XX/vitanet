# Phase 5: Posts & Feed — Build Log

**Date**: September 2026
**Status**: Complete

## What Was Built

### Controllers & Routes
| File | Purpose |
|------|---------|
| `src/controllers/postController.js` | Post creation (`createPost` verifying finalized media items), editing (`editPost`), soft deletion (`deletePost` cascading media cleanup), retrieval (`getPost`), and interactions (`likePost`, `unlikePost`, `savePost`, `unsavePost`). |
| `src/controllers/feedController.js` | Chronological following feed (`getFollowingFeed`) and transparent scored explore feed (`getExploreFeed`), excluding blocked, muted, or removed content. |
| `src/controllers/commentController.js` | Add comment (`addComment`), delete comment (`deleteComment`), and list comments (`getPostComments`) with cursor pagination. |
| `src/controllers/notificationController.js` | Retrieve user notifications (`getNotifications`), unread count (`getUnreadCount`), and mark as read (`markRead`). |
| `src/routes/posts.js` | Post CRUD and interaction routes. |
| `src/routes/feed.js` | Following and Explore feed routes. |
| `src/routes/notifications.js` | Notification queries and status updates. |

## Design Decisions

1. **Chronological Following Feed**:
   - The primary feed is strictly reverse-chronological (`createdAt: -1`).
   - Content from muted or blocked accounts is completely filtered at the query stage.
2. **Transparent Explore Feed Algorithm**:
   - Explore feed ranks public posts using a documented, transparent formula:
     $$\text{Score} = \frac{2 \times \text{likes} + 3 \times \text{saves} + 2 \times \text{comments} + 1}{(\text{ageInHours} + 2)^{1.2}}$$
   - Gravity factor ($1.2$) ensures fresh content naturally surfaces without opaque algorithmic manipulation or engagement traps.
3. **Content Warnings**:
   - Authors can attach optional `contentWarning` labels (e.g. sensitive topics, spoilers). Clients blur media and hide text behind an interactive reveal toggle.
4. **Cascade Deletion**:
   - Deleting a post marks referenced media as `pending_delete` in `MediaUsage`, cleans up associated likes, saves, and comments, and decrements user counters atomically.

## Constraints Validated
- ✅ Posts only reference verified `finalized` media in `MediaUsage`
- ✅ Batch presigned download URLs attached to feed responses for private R2 access
- ✅ Zero full collection scans; indexed queries for author, status, and createdAt
