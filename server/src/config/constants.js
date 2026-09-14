/**
 * Application-wide constants and hard caps.
 * These enforce the zero-cost free-tier budget.
 * Changing these values may cause free-tier overages.
 */

// ── User Limits ──
export const GLOBAL_USER_CAP = 100;
export const USERNAME_MAX_CHARS = 30;
export const USERNAME_MIN_CHARS = 3;
export const BIO_MAX_CHARS = 160;
export const DISPLAY_NAME_MAX_CHARS = 50;
export const PASSWORD_MIN_CHARS = 8;
export const PASSWORD_MAX_CHARS = 128;

// ── Media Limits ──
export const GLOBAL_MEDIA_CAP_BYTES = 7 * 1024 * 1024 * 1024;       // 7 GB
export const PER_USER_MEDIA_QUOTA_BYTES = 75 * 1024 * 1024;          // 75 MB
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;                     // 10 MB
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;                     // 50 MB
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;                     // 5 MB
export const MAX_IMAGE_LONG_EDGE_PX = 1920;
export const VIDEO_MAX_SECONDS = 30;
export const MEDIA_ITEMS_PER_POST = 4;

// ── Content Limits ──
export const CAPTION_MAX_CHARS = 2200;
export const COMMENT_MAX_CHARS = 1000;
export const POSTS_PER_USER_TOTAL = 100;
export const POSTS_PER_USER_DAY = 10;

// ── Accepted MIME Types ──
export const ACCEPTED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_VIDEO_MIMES = ['video/mp4'];
export const ACCEPTED_AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALL_ACCEPTED_MIMES = [...ACCEPTED_IMAGE_MIMES, ...ACCEPTED_VIDEO_MIMES];

// ── Auth ──
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
export const EMAIL_TOKEN_EXPIRY_HOURS = 24;
export const EMAIL_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
export const PRESIGNED_PUT_EXPIRY_SECONDS = 600;    // 10 minutes
export const PRESIGNED_GET_EXPIRY_SECONDS = 900;    // 15 minutes
export const MAX_SESSIONS_PER_USER = 10;

// ── Pagination ──
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// ── Rate Limits ──
export const RATE_LIMITS = {
  signup:         { windowMs: 60 * 60 * 1000,  max: 5   },   // 5/IP/hour
  login:          { windowMs: 15 * 60 * 1000,  max: 10  },   // 10/IP/15min
  passwordReset:  { windowMs: 60 * 60 * 1000,  max: 5   },   // 5/hour
  posts:          { windowMs: 24 * 60 * 60 * 1000, max: 10 }, // 10/user/day
  comments:       { windowMs: 60 * 60 * 1000,  max: 60  },   // 60/user/hour
  likes:          { windowMs: 60 * 60 * 1000,  max: 300 },   // 300/user/hour
  follows:        { windowMs: 60 * 60 * 1000,  max: 100 },   // 100/user/hour
  reports:        { windowMs: 60 * 60 * 1000,  max: 20  },   // 20/user/hour
  presignUpload:  { windowMs: 60 * 60 * 1000,  max: 20  },   // 20/user/hour
  general:        { windowMs: 60 * 1000,        max: 120 },   // 120/IP/minute
  admin:          { windowMs: 60 * 1000,        max: 60  },   // 60/admin/minute
};

// ── Brevo Email ──
export const BREVO_DAILY_LIMIT = 300;

// ── Moderation ──
export const REPORT_REASONS = [
  'spam', 'harassment', 'hate', 'sexual_content', 'violence',
  'illegal_activity', 'impersonation', 'copyright',
  'privacy_violation', 'self_harm', 'other',
];

export const MODERATION_ACTIONS = [
  'no_action', 'warning', 'remove_content', 'suspend_user', 'ban_user',
];

// ── Account States ──
export const ACCOUNT_STATES = [
  'pending_verification', 'active', 'suspended', 'banned', 'deleted',
];

// ── User Roles ──
export const USER_ROLES = ['user', 'moderator', 'admin'];

// ── Post Visibility ──
export const POST_VISIBILITY = ['public', 'followers_only'];

// ── Post Moderation Status ──
export const MODERATION_STATUS = ['approved', 'pending', 'removed'];

// ── Media Status ──
export const MEDIA_STATUS = ['uploading', 'completed', 'pending_delete', 'deleted'];

// ── Upload Session Status ──
export const UPLOAD_SESSION_STATUS = ['pending', 'completed', 'expired', 'failed'];

// ── Notification Types ──
export const NOTIFICATION_TYPES = ['like', 'comment', 'follow', 'mention', 'moderation'];

// ── Audit Event Actions ──
export const AUDIT_ACTIONS = [
  'user_register', 'user_login', 'user_logout',
  'user_suspend', 'user_unsuspend', 'user_ban', 'user_unban', 'user_delete',
  'post_create', 'post_update', 'post_delete', 'post_remove_moderation',
  'comment_create', 'comment_delete',
  'report_create', 'report_resolve',
  'media_upload', 'media_delete', 'media_orphan_cleanup',
  'admin_action',
];

// ── Explore Feed ──
export const EXPLORE_SCORE_WEIGHTS = {
  likeWeight: 2,
  saveWeight: 3,
  commentWeight: 2,
  baseOffset: 1,
  ageOffsetHours: 2,
  decayExponent: 1.2,
};

// ── MongoDB ──
export const METADATA_SOFT_CAP_BYTES = 350 * 1024 * 1024; // 350 MB

// ── R2 Object Key Patterns ──
export const R2_KEY_PATTERNS = {
  avatar: (userId, mediaId) => `users/${userId}/avatar/${mediaId}.webp`,
  post: (postId, mediaId, ext) => `posts/${postId}/${mediaId}.${ext}`,
  temporary: (userId, uploadId, ext) => `tmp/${userId}/${uploadId}.${ext}`,
};

// ── JSON Body Limits ──
export const JSON_BODY_LIMIT = '256kb';
