/**
 * AI System - Tap Rate Based
 *
 * Rule-based AI that decides tap rate based on game state.
 * Based on TECHNICAL_DESIGN.md specification.
 */

import type { PhysicsState } from '../types/game';

/**
 * AI decision result
 * Returns tap rate (taps per second) based on current state
 */
export interface AIDecision {
  /** Whether AI should tap */
  shouldTap: boolean;
  /** Tap rate (taps per second) */
  tapRate: number;
}

/**
 * AIEngine class
 * Decides tap rate based on distance, tipping, and opponent state
 */
export class AIEngine {
  /** Last tap timestamp */
  private lastTapTime = 0;

  /** Interval between taps (ms) - dynamically adjusted */
  private tapInterval = 200; // Default: 5 taps/sec

  /**
   * Decide AI action based on current state
   *
   * @param self - AI's physics state (opponent)
   * @param opponent - Player's physics state
   * @param currentTime - Current timestamp (ms)
   * @returns AI decision
   */
  decide(self: PhysicsState, opponent: PhysicsState, currentTime: number): AIDecision {
    // Calculate distance (XZ plane)
    const distance = Math.sqrt(
      (opponent.position.x - self.position.x) ** 2 +
        (opponent.position.z - self.position.z) ** 2
    );

    // Determine tap rate based on state
    let tapRate: number;

    // 1. If self is tipping badly (> 0.6), slow down to stabilize
    if (self.tipping > 0.6) {
      tapRate = this.randomInRange(4, 6); // Slow, cautious taps
    }
    // 2. If opponent is tipping (> 0.5), attack aggressively
    else if (opponent.tipping > 0.5) {
      tapRate = this.randomInRange(10, 15); // Fast, aggressive taps
    }
    // 3. If close distance (< 2.0), tap fast to push
    else if (distance < 2.0) {
      tapRate = this.randomInRange(8, 12); // High-speed taps
    }
    // 4. Default: Medium tap rate
    else {
      tapRate = this.randomInRange(5, 8); // Balanced taps
    }

    // Convert tap rate to interval (ms between taps)
    this.tapInterval = 1000 / tapRate;

    // Check if it's time to tap
    const shouldTap = currentTime - this.lastTapTime >= this.tapInterval;

    if (shouldTap) {
      this.lastTapTime = currentTime;
    }

    return {
      shouldTap,
      tapRate,
    };
  }

  /**
   * Execute tap if decision says to
   * Call this from game loop with executeTap action
   *
   * @param decision - AI decision from decide()
   * @param executeTap - Function to execute tap
   */
  update(decision: AIDecision, executeTap: () => void): void {
    if (decision.shouldTap) {
      executeTap();
    }
  }

  /**
   * Reset AI state
   * Called when starting new game
   */
  reset(): void {
    this.lastTapTime = 0;
    this.tapInterval = 200; // Reset to default (5 taps/sec)
  }

  /**
   * Random value in range (inclusive)
   * Adds variation to AI behavior
   *
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random value between min and max
   * @private
   */
  private randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
