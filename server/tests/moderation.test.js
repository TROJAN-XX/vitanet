import { describe, it, expect } from '@jest/globals';
import { MODERATION_ACTIONS } from '../src/config/constants.js';

describe('Moderation Constants & Action Specs', () => {
  it('should include all required moderation actions', () => {
    expect(MODERATION_ACTIONS).toContain('no_action');
    expect(MODERATION_ACTIONS).toContain('warning');
    expect(MODERATION_ACTIONS).toContain('remove_content');
    expect(MODERATION_ACTIONS).toContain('suspend_user');
    expect(MODERATION_ACTIONS).toContain('ban_user');
  });

  it('should have exactly 5 canonical moderation resolution actions', () => {
    expect(MODERATION_ACTIONS.length).toBe(5);
  });
});
