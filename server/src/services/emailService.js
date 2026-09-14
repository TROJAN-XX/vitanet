import env from '../config/env.js';
import { BREVO_DAILY_LIMIT } from '../config/constants.js';

/**
 * In-memory daily email counter.
 * Resets each calendar day. Enforces Brevo free-tier 300/day limit.
 */
let emailCounter = { date: new Date().toDateString(), count: 0 };

function checkDailyLimit() {
  const today = new Date().toDateString();
  if (emailCounter.date !== today) {
    emailCounter = { date: today, count: 0 };
  }
  return emailCounter.count < BREVO_DAILY_LIMIT;
}

function incrementCounter() {
  const today = new Date().toDateString();
  if (emailCounter.date !== today) {
    emailCounter = { date: today, count: 1 };
  } else {
    emailCounter.count++;
  }
}

/**
 * Send a transactional email via Brevo API.
 * Falls back to console logging in development when ENABLE_EMAIL is false.
 * @param {{ to: string, subject: string, htmlContent: string }} params
 */
export async function sendEmail({ to, subject, htmlContent }) {
  // Development fallback
  if (!env.ENABLE_EMAIL) {
    console.log(`[EMAIL-DEV] To: ${to}`);
    console.log(`[EMAIL-DEV] Subject: ${subject}`);
    console.log(`[EMAIL-DEV] Content: ${htmlContent}`);
    return { success: true, dev: true };
  }

  if (!checkDailyLimit()) {
    console.warn('[EMAIL] Daily email limit reached (300/day Brevo free tier)');
    throw new Error('Daily email limit reached');
  }

  const body = {
    sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
    to: [{ email: to }],
    subject,
    htmlContent,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text().catch(() => 'Unknown error');
    console.error(`[EMAIL] Brevo API error: ${res.status} ${error}`);
    throw new Error(`Email send failed: ${res.status}`);
  }

  incrementCounter();
  return { success: true };
}

/**
 * Send email verification email.
 * @param {string} to - Recipient email
 * @param {string} token - Verification token (plaintext, for URL)
 */
export async function sendVerificationEmail(to, token) {
  const verifyUrl = `${env.APP_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to,
    subject: 'Verify your VitaNet email',
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #12121a; color: #f0f0f5; border-radius: 12px;">
        <h1 style="font-size: 24px; margin-bottom: 16px; background: linear-gradient(135deg, #7c5cfc, #00d4aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Welcome to VitaNet</h1>
        <p style="color: #9999b0; line-height: 1.6; margin-bottom: 24px;">Click the button below to verify your email address and activate your account.</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #7c5cfc, #00d4aa); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
        <p style="color: #666680; font-size: 13px; margin-top: 24px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send password reset email.
 * @param {string} to - Recipient email
 * @param {string} token - Reset token (plaintext, for URL)
 */
export async function sendPasswordResetEmail(to, token) {
  const resetUrl = `${env.APP_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to,
    subject: 'Reset your VitaNet password',
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #12121a; color: #f0f0f5; border-radius: 12px;">
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #f0f0f5;">Password Reset</h1>
        <p style="color: #9999b0; line-height: 1.6; margin-bottom: 24px;">You requested a password reset. Click the button below to set a new password.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #7c5cfc, #00d4aa); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
        <p style="color: #666680; font-size: 13px; margin-top: 24px;">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

/** Get current daily email count (for admin dashboard). */
export function getEmailCountToday() {
  const today = new Date().toDateString();
  return emailCounter.date === today ? emailCounter.count : 0;
}
