# VitaNet — Moderation & Community Safety Architecture

VitaNet provides defense-in-depth moderation tools to keep discussions authentic, respectful, and safe without relying on opaque algorithmic suppression.

---

## 1. Reporting Pipeline

Users can report accounts, posts, or comments by selecting one of six standardized violation categories:
1. `spam`: Automated posting, bot accounts, or unauthorized promotions.
2. `harassment`: Targeted intimidation, personal attacks, or bullying.
3. `hate_speech`: Discrimination or vilification targeting protected groups.
4. `inappropriate`: Sexually explicit or violently graphic media.
5. `copyright`: Intellectual property or DMCA infringements.
6. `other`: General violations of the Community Guidelines.

---

## 2. Role Hierarchy & Access Matrix

| Capability | Regular User | Moderator | Administrator |
|------------|:------------:|:---------:|:-------------:|
| Submit Content Report | ✅ | ✅ | ✅ |
| View Moderation Triage Queue | ❌ | ✅ | ✅ |
| Dismiss False Reports | ❌ | ✅ | ✅ |
| Remove Violative Posts | ❌ | ✅ | ✅ |
| Suspend / Ban User Accounts | ❌ | ❌ | ✅ |
| Modify Staff Roles | ❌ | ❌ | ✅ |
| Run Orphan Media Cleanup | ❌ | ❌ | ✅ |
| Inspect Audit Event Log | ❌ | ✅ | ✅ |

---

## 3. Post Removal & Media Purging Cascade

When a post is taken down via `POST /api/v1/admin/posts/:id/remove`:
1. The post document is marked with `deletedAt: new Date()` and removed from feed indexing.
2. Referenced media records in `MediaUsage` are updated to `status: 'pending_delete'`.
3. Associated likes, comments, and saves are updated.
4. An immutable `AuditEvent` is written recording the moderator ID, reason, and target post ID.
5. The daily orphan media reconciler purges the physical file from Cloudflare R2.
