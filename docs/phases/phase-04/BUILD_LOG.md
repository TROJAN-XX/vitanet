# Phase 4: Social Graph — Build Log

**Date**: September 2026
**Status**: Complete

## What Was Built

### Controllers & Routes
| File | Purpose |
|------|---------|
| `src/controllers/userController.js` | User profiles (`getProfile`, `updateProfile`, `presignAvatarUpload`, `presignHeaderUpload`), social graph mutations (`followUser`, `unfollowUser`, `blockUser`, `unblockUser`, `muteUser`, `unmuteUser`), and cursor-paginated list queries (`getFollowers`, `getFollowing`). |
| `src/routes/users.js` | Full route mapping for profile management and graph relationships with auth guards. |

## Design Decisions

1. **Bi-directional Block Filtering**:
   - If User A blocks User B, User B cannot view User A's profile, posts, or comments, and vice-versa.
   - All relationship queries check both `(blockerId: A, blockedId: B)` and `(blockerId: B, blockedId: A)` to maintain mutual invisibility.
2. **One-Way Muting**:
   - Muting hides the muted user's content from the muter's feed and notifications without notifying the muted account.
3. **Cursor-Based Pagination**:
   - Follower and following lists use cursor pagination (`createdAt` + `_id`) rather than `skip`/`limit` to ensure consistent performance as the graph grows.
4. **Denormalized Counters with Concurrency Safety**:
   - `followersCount` and `followingCount` on the `User` model are updated atomically via MongoDB `$inc` inside follow/unfollow operations.

## Constraints Validated
- ✅ Self-following, self-blocking, and self-muting explicitly prohibited
- ✅ Blocked users immediately removed from follow relationships
- ✅ Profile media (avatar, header) respects user's 75MB quota
- ✅ No unbounded database queries (all list endpoints enforce strict max limits)
