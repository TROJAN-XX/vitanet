import { describe, it, expect } from '@jest/globals';
import {
  ACCEPTED_IMAGE_MIMES,
  ACCEPTED_VIDEO_MIMES,
  BIO_MAX_CHARS,
  DISPLAY_NAME_MAX_CHARS,
} from '../src/config/constants.js';

describe('Validation Schema Rules', () => {
  const usernameRegex = /^[a-z0-9_]{3,30}$/;

  it('accepts valid usernames', () => {
    expect(usernameRegex.test('alice')).toBe(true);
    expect(usernameRegex.test('bob_creator')).toBe(true);
    expect(usernameRegex.test('creator123')).toBe(true);
    expect(usernameRegex.test('a_b_c_1_2_3')).toBe(true);
  });

  it('rejects invalid usernames', () => {
    expect(usernameRegex.test('al')).toBe(false); // Too short
    expect(usernameRegex.test('alice-smith')).toBe(false); // Hyphen not allowed
    expect(usernameRegex.test('Alice')).toBe(false); // Uppercase not allowed
    expect(usernameRegex.test('alice.smith')).toBe(false); // Period not allowed
    expect(usernameRegex.test('a'.repeat(31))).toBe(false); // Too long
  });

  it('allows standard web image MIME types', () => {
    expect(ACCEPTED_IMAGE_MIMES).toContain('image/jpeg');
    expect(ACCEPTED_IMAGE_MIMES).toContain('image/png');
    expect(ACCEPTED_IMAGE_MIMES).toContain('image/webp');
  });

  it('allows standard web video MIME types', () => {
    expect(ACCEPTED_VIDEO_MIMES).toContain('video/mp4');
  });

  it('enforces bio and display name character constraints', () => {
    expect(BIO_MAX_CHARS).toBe(160);
    expect(DISPLAY_NAME_MAX_CHARS).toBe(50);
  });
});
