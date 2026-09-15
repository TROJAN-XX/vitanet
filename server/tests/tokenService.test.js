import { describe, it, expect } from '@jest/globals';
import { hashToken, generateAccessToken } from '../src/services/tokenService.js';

describe('Token Service Security', () => {
  it('should generate consistent SHA-256 hashes for tokens', () => {
    const rawToken = 'my_secure_random_token_12345';
    const hash1 = hashToken(rawToken);
    const hash2 = hashToken(rawToken);

    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBe(64); // 256 bits = 64 hex characters
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different tokens', () => {
    const hashA = hashToken('token_a');
    const hashB = hashToken('token_b');
    expect(hashA).not.toBe(hashB);
  });

  it('should generate a valid JWT string for access token', () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      role: 'user',
    };

    const token = generateAccessToken(user);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // header.payload.signature
  });
});
