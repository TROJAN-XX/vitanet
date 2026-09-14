# Phase 3: Media Pipeline — Build Log

**Date**: September 2026
**Status**: Complete

## What Was Built

### Services & Jobs
| File | Purpose |
|------|---------|
| `src/services/r2Service.js` | Cloudflare R2 S3-compatible client (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`). Creates presigned PUT (10m) and presigned GET (15m) URLs, HeadObject checks, and DeleteObject operations. |
| `src/services/quotaService.js` | Enforces 75 MB per-user quota and 7 GB global platform cap. Manages `UploadSession` pre-reservations and `MediaUsage` ledger reconciliation. |
| `src/jobs/orphanCleanup.js` | Scans for expired upload sessions and unreferenced/pending-delete media in R2, purges objects from bucket, and clears ledger entries. |

### Controllers & Routes
| File | Purpose |
|------|---------|
| `src/controllers/mediaController.js` | `presignUpload` (validates MIME/size, enforces quotas, generates PUT URL), `finalizeUpload` (HEAD check on R2, records `MediaUsage`), `presignDownloadBatch` (generates batch GET URLs for feed posts), `deleteMedia`. |
| `src/routes/media.js` | Secured endpoints for media lifecycle: `/presign-upload`, `/finalize-upload`, `/download-batch`, and `/:id`. |

## Design Decisions

1. **Zero Media Bytes Through Express**: The Render API server never streams, buffers, or processes file binaries. Clients upload directly to Cloudflare R2 via presigned PUT URLs, keeping server memory minimal and Render completely free.
2. **Private R2 Bucket Only**: The R2 bucket has public access (`r2.dev`) disabled. All media viewing is mediated through short-lived presigned GET URLs (15-minute expiry) issued by the backend, ensuring access control and preventing hotlinking.
3. **Two-Phase Upload Lifecycle**:
   - Step 1 (`presignUpload`): Quota check verifies `userUsage + requestedBytes <= 75MB` and `globalUsage + requestedBytes <= 7GB`. An `UploadSession` document is saved.
   - Step 2 (`finalizeUpload`): The backend verifies object presence and actual byte size via S3 `HeadObjectCommand`. On success, the `UploadSession` is marked consumed and a permanent `MediaUsage` record is registered.
4. **Orphan Cleanup Defense**: Abandoned uploads (where the user never called finalize) are automatically reclaimed by `orphanCleanup.js` after 15 minutes, preventing quota leakage.

## Constraints Validated
- ✅ Media never stored in MongoDB (only objectKey and metadata stored)
- ✅ Media never passes through Express server memory or filesystem
- ✅ 75 MB per-user quota enforced before presigning
- ✅ 7 GB global cap enforced before presigning
- ✅ Private R2 bucket with time-limited signed URLs
