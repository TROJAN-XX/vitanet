import { describe, it, expect } from '@jest/globals';

/**
 * Explore score calculation formula documented in Phase 5:
 * Score = (2 * likes + 3 * saves + 2 * comments + 1) / (ageInHours + 2)^1.2
 */
function calculateExploreScore({ likes = 0, saves = 0, comments = 0, ageInHours = 0 }) {
  const numerator = 2 * likes + 3 * saves + 2 * comments + 1;
  const denominator = Math.pow(ageInHours + 2, 1.2);
  return numerator / denominator;
}

describe('Explore Feed Ranking Algorithm', () => {
  it('assigns base positive score to fresh posts with zero interactions', () => {
    const score = calculateExploreScore({ likes: 0, saves: 0, comments: 0, ageInHours: 0 });
    // 1 / (2^1.2) approx 0.435
    expect(score).toBeGreaterThan(0.4);
    expect(score).toBeLessThan(0.5);
  });

  it('weights saves higher than likes and comments', () => {
    const postWithLikes = calculateExploreScore({ likes: 5, saves: 0, comments: 0, ageInHours: 1 });
    const postWithSaves = calculateExploreScore({ likes: 0, saves: 5, comments: 0, ageInHours: 1 });

    // 2 * 5 = 10 vs 3 * 5 = 15
    expect(postWithSaves).toBeGreaterThan(postWithLikes);
  });

  it('decays score as post age increases', () => {
    const freshPost = calculateExploreScore({ likes: 10, saves: 2, comments: 3, ageInHours: 1 });
    const oldPost = calculateExploreScore({ likes: 10, saves: 2, comments: 3, ageInHours: 24 });

    expect(freshPost).toBeGreaterThan(oldPost);
  });

  it('allows high-engagement older posts to rank above low-engagement fresh posts', () => {
    const viralOlderPost = calculateExploreScore({ likes: 50, saves: 20, comments: 15, ageInHours: 6 });
    const quietFreshPost = calculateExploreScore({ likes: 1, saves: 0, comments: 0, ageInHours: 0.5 });

    expect(viralOlderPost).toBeGreaterThan(quietFreshPost);
  });
});
