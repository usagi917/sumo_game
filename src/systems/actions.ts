/**
 * Actions System
 *
 * Defines and executes game actions: push, tsuppari, special
 * MVP: Fixed damage and knockback values, simple cooldown system
 */

import type { ActionType } from '../types/game';
import { ACTION_DAMAGE, ACTION_KNOCKBACK, ACTION_COOLDOWNS } from '../types/game';

/**
 * Action execution result
 * Contains all data needed to apply action effects
 */
export interface ActionResult {
  /** Type of action executed */
  action: ActionType;
  /** Damage to apply to target */
  damage: number;
  /** Knockback force to apply */
  knockback: number;
  /** Cooldown duration in milliseconds */
  cooldown: number;
  /** Whether action succeeded */
  success: boolean;
  /** Reason for failure (if success = false) */
  failureReason?: string;
}

/**
 * Validate if action can be executed
 * Checks cooldown and special gauge requirements
 *
 * @param action - Action type to validate
 * @param currentCooldown - Current cooldown for this action (ms)
 * @param currentGauge - Current gauge value (0-100)
 * @returns Object with canExecute flag and reason if false
 */
export function validateAction(
  action: ActionType,
  currentCooldown: number,
  currentGauge: number
): { canExecute: boolean; reason?: string } {
  // Check cooldown
  if (currentCooldown > 0) {
    return {
      canExecute: false,
      reason: `Action on cooldown: ${Math.ceil(currentCooldown)}ms remaining`,
    };
  }

  // Check gauge for special
  if (action === 'special' && currentGauge < 100) {
    return {
      canExecute: false,
      reason: `Insufficient gauge: ${currentGauge}/100`,
    };
  }

  return { canExecute: true };
}

/**
 * Execute push action
 * Strong single hit with medium knockback
 *
 * @param currentCooldown - Current push cooldown (ms)
 * @returns ActionResult
 */
export function executePush(currentCooldown: number): ActionResult {
  const validation = validateAction('push', currentCooldown, 0);

  if (!validation.canExecute) {
    return {
      action: 'push',
      damage: 0,
      knockback: 0,
      cooldown: 0,
      success: false,
      failureReason: validation.reason,
    };
  }

  return {
    action: 'push',
    damage: ACTION_DAMAGE.push,
    knockback: ACTION_KNOCKBACK.push,
    cooldown: ACTION_COOLDOWNS.push,
    success: true,
  };
}

/**
 * Execute tsuppari action (連続突き)
 * Rapid successive palm strikes
 * Weaker damage but faster, less knockback
 *
 * @param currentCooldown - Current tsuppari cooldown (ms)
 * @returns ActionResult
 */
export function executeTsuppari(currentCooldown: number): ActionResult {
  const validation = validateAction('tsuppari', currentCooldown, 0);

  if (!validation.canExecute) {
    return {
      action: 'tsuppari',
      damage: 0,
      knockback: 0,
      cooldown: 0,
      success: false,
      failureReason: validation.reason,
    };
  }

  return {
    action: 'tsuppari',
    damage: ACTION_DAMAGE.tsuppari,
    knockback: ACTION_KNOCKBACK.tsuppari,
    cooldown: ACTION_COOLDOWNS.tsuppari,
    success: true,
  };
}

/**
 * Execute special move
 * Powerful attack that consumes full gauge
 * Maximum damage and knockback, no cooldown (gauge is the limit)
 *
 * @param currentCooldown - Current special cooldown (ms, should be 0)
 * @param currentGauge - Current gauge value (0-100)
 * @returns ActionResult
 */
export function executeSpecial(currentCooldown: number, currentGauge: number): ActionResult {
  const validation = validateAction('special', currentCooldown, currentGauge);

  if (!validation.canExecute) {
    return {
      action: 'special',
      damage: 0,
      knockback: 0,
      cooldown: 0,
      success: false,
      failureReason: validation.reason,
    };
  }

  return {
    action: 'special',
    damage: ACTION_DAMAGE.special,
    knockback: ACTION_KNOCKBACK.special,
    cooldown: ACTION_COOLDOWNS.special,
    success: true,
  };
}

/**
 * Get action data by type
 * Utility function for generic action handling
 *
 * @param action - Action type
 * @returns Object with damage, knockback, cooldown values
 */
export function getActionData(action: ActionType): {
  damage: number;
  knockback: number;
  cooldown: number;
} {
  return {
    damage: ACTION_DAMAGE[action],
    knockback: ACTION_KNOCKBACK[action],
    cooldown: ACTION_COOLDOWNS[action],
  };
}

/**
 * Update cooldown
 * Called each frame to decrease cooldowns
 *
 * @param currentCooldown - Current cooldown (ms)
 * @param deltaTime - Time elapsed since last frame (ms)
 * @returns New cooldown value (clamped to 0)
 */
export function updateCooldown(currentCooldown: number, deltaTime: number): number {
  return Math.max(0, currentCooldown - deltaTime);
}

/**
 * Check if any action is ready
 * For UI feedback
 *
 * @param cooldowns - All cooldowns { push, tsuppari, special }
 * @param gauge - Current gauge for special check
 * @returns Object indicating which actions are ready
 */
export function getActionAvailability(
  cooldowns: Record<ActionType, number>,
  gauge: number
): Record<ActionType, boolean> {
  return {
    push: cooldowns.push === 0,
    tsuppari: cooldowns.tsuppari === 0,
    special: cooldowns.special === 0 && gauge >= 100,
  };
}
