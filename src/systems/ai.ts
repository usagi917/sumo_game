/**
 * AI System - Gauge-Based Battle AI
 *
 * AI that charges gauge at rank-appropriate speed.
 * Higher ranks = faster gauge charging.
 */

import type { SumoRank } from '../state/rankingStore';

/**
 * AI decision result
 */
export interface AIDecision {
  shouldTap: boolean;
}

/**
 * Difficulty settings per rank
 * gaugeSpeed: taps per second equivalent
 */
interface DifficultySettings {
  /** Base tap rate (taps per second) */
  tapRate: number;
  /** Randomness factor (0-1, higher = more variance) */
  variance: number;
}

const DIFFICULTY_BY_RANK: Record<SumoRank, DifficultySettings> = {
  // 十両 - Slow and predictable
  0: {
    tapRate: 1.5,
    variance: 0.3,
  },
  // 幕内 - Slightly faster
  1: {
    tapRate: 2.0,
    variance: 0.25,
  },
  // 小結 - Competitive
  2: {
    tapRate: 2.5,
    variance: 0.2,
  },
  // 関脇 - Fast
  3: {
    tapRate: 3.0,
    variance: 0.15,
  },
  // 大関 - Very fast
  4: {
    tapRate: 3.5,
    variance: 0.1,
  },
  // 横綱 - Extremely fast
  5: {
    tapRate: 4.2,
    variance: 0.05,
  },
};

/**
 * AIEngine class
 * Simple tap-rate based AI for gauge charging
 */
export class AIEngine {
  private lastTapTime = 0;
  private nextTapDelay = 500;
  private currentRank: SumoRank = 0;

  /**
   * Set difficulty based on player rank
   */
  setRank(rank: SumoRank): void {
    this.currentRank = rank;
    this.calculateNextDelay();
  }

  /**
   * Calculate next tap delay based on settings
   */
  private calculateNextDelay(): void {
    const settings = DIFFICULTY_BY_RANK[this.currentRank];
    const baseDelay = 1000 / settings.tapRate;
    const variance = baseDelay * settings.variance;
    this.nextTapDelay = baseDelay + (Math.random() - 0.5) * 2 * variance;
  }

  /**
   * Decide if AI should tap
   */
  decide(currentTime: number): AIDecision {
    const elapsed = currentTime - this.lastTapTime;

    if (elapsed >= this.nextTapDelay) {
      this.lastTapTime = currentTime;
      this.calculateNextDelay();
      return { shouldTap: true };
    }

    return { shouldTap: false };
  }

  /**
   * Reset AI state
   */
  reset(): void {
    this.lastTapTime = 0;
    this.calculateNextDelay();
  }
}
