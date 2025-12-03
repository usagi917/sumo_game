/**
 * Gauge System
 *
 * Manages the special move gauge that fills as you fight
 * MVP: Simple increment/decrement logic
 */

import { GAUGE_INCREASE, GAME_CONSTANTS } from '../types/game';

/**
 * Increase gauge when hitting opponent
 *
 * @param currentGauge - Current gauge value (0-100)
 * @returns New gauge value (clamped to 100)
 */
export function increaseGaugeOnHit(currentGauge: number): number {
  const newGauge = currentGauge + GAUGE_INCREASE.onHit;
  return Math.min(100, newGauge);
}

/**
 * Increase gauge when damaged by opponent
 *
 * @param currentGauge - Current gauge value (0-100)
 * @returns New gauge value (clamped to 100)
 */
export function increaseGaugeOnDamaged(currentGauge: number): number {
  const newGauge = currentGauge + GAUGE_INCREASE.onDamaged;
  return Math.min(100, newGauge);
}

/**
 * Consume gauge for special move
 *
 * @param currentGauge - Current gauge value (0-100)
 * @param cost - Amount to consume (default: SPECIAL_GAUGE_COST)
 * @returns New gauge value (clamped to 0)
 */
export function consumeGauge(
  currentGauge: number,
  cost: number = GAME_CONSTANTS.SPECIAL_GAUGE_COST
): number {
  const newGauge = currentGauge - cost;
  return Math.max(0, newGauge);
}

/**
 * Check if gauge is sufficient for special move
 *
 * @param currentGauge - Current gauge value (0-100)
 * @param requiredGauge - Required gauge amount (default: SPECIAL_GAUGE_COST)
 * @returns true if can use special, false otherwise
 */
export function canUseSpecial(
  currentGauge: number,
  requiredGauge: number = GAME_CONSTANTS.SPECIAL_GAUGE_COST
): boolean {
  return currentGauge >= requiredGauge;
}

/**
 * Calculate gauge fill percentage
 *
 * @param currentGauge - Current gauge value (0-100)
 * @returns Percentage (0.0 - 1.0)
 */
export function getGaugePercentage(currentGauge: number): number {
  return Math.max(0, Math.min(1, currentGauge / 100));
}

/**
 * Get gauge color based on fill level
 * For UI visualization
 *
 * @param currentGauge - Current gauge value (0-100)
 * @returns CSS color variable name
 */
export function getGaugeColor(currentGauge: number): string {
  if (currentGauge >= GAME_CONSTANTS.SPECIAL_GAUGE_COST) {
    return 'var(--gauge-blue)';
  }
  return 'var(--retro-dark)';
}

/**
 * Reset gauge to 0
 * Used when starting new game
 *
 * @returns 0
 */
export function resetGauge(): number {
  return 0;
}

/**
 * Calculate gauge increase based on damage dealt
 * Alternative formula for future balancing
 *
 * @param damageDealt - Amount of damage dealt
 * @returns Gauge increase amount
 */
export function calculateGaugeFromDamage(damageDealt: number): number {
  // Simple formula: 10% of damage becomes gauge
  // Can be adjusted for balance
  const gaugeIncrease = damageDealt * 0.1;
  return Math.round(gaugeIncrease);
}
