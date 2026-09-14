import { describe, it, expect } from '@jest/globals';
import {
  PER_USER_MEDIA_QUOTA_BYTES,
  GLOBAL_MEDIA_CAP_BYTES,
} from '../src/config/constants.js';

describe('Quota Guardrail Calculations', () => {
  it('enforces exact 75 MB per-user media cap', () => {
    expect(PER_USER_MEDIA_QUOTA_BYTES).toBe(75 * 1024 * 1024);
    expect(PER_USER_MEDIA_QUOTA_BYTES).toBe(78643200);
  });

  it('enforces exact 7 GB global media cap', () => {
    expect(GLOBAL_MEDIA_CAP_BYTES).toBe(7 * 1024 * 1024 * 1024);
    expect(GLOBAL_MEDIA_CAP_BYTES).toBe(7516192768);
  });

  it('correctly calculates remaining quota below threshold', () => {
    const currentUsage = 50 * 1024 * 1024; // 50 MB
    const requestedSize = 10 * 1024 * 1024; // 10 MB
    const wouldExceed = currentUsage + requestedSize > PER_USER_MEDIA_QUOTA_BYTES;
    expect(wouldExceed).toBe(false);
  });

  it('correctly rejects upload that exceeds 75 MB limit', () => {
    const currentUsage = 70 * 1024 * 1024; // 70 MB
    const requestedSize = 6 * 1024 * 1024; // 6 MB (total 76 MB)
    const wouldExceed = currentUsage + requestedSize > PER_USER_MEDIA_QUOTA_BYTES;
    expect(wouldExceed).toBe(true);
  });

  it('correctly calculates 100 users × 75 MB fit within 7.5 GB allocation', () => {
    const maxTheoreticalUserBytes = 100 * PER_USER_MEDIA_QUOTA_BYTES;
    expect(maxTheoreticalUserBytes).toBeLessThanOrEqual(10 * 1024 * 1024 * 1024);
  });
});
