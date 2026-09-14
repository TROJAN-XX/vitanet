import { Router } from 'express';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { presignUploadLimiter } from '../middleware/rateLimiter.js';
import * as media from '../controllers/mediaController.js';

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/presign-upload',        requireAuth, requireVerifiedEmail, presignUploadLimiter, wrap(media.presignUpload));
router.post('/finalize-upload',       requireAuth, wrap(media.finalizeUpload));
router.post('/presign-download-batch', requireAuth, wrap(media.presignDownloadBatch));
router.delete('/:mediaId',            requireAuth, wrap(media.deleteMedia));

export default router;
