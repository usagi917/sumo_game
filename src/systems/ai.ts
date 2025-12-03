/**
 * AI System
 *
 * Simple rule-based AI for opponent
 * MVP: Basic decision-making based on distance, HP, and gauge
 */

import { Vector3 } from 'three';
import type { ActionType, Actor } from '../types/game';
import { getDistance2D } from './movement';
import { isInActionRange } from './collision';

/**
 * AI decision result
 * Tells the game what action the AI wants to take
 */
export interface AIDecision {
  /** Chosen action (or null if no action) */
  action: ActionType | null;
  /** Movement direction (or null if not moving) */
  moveDirection: Vector3 | null;
  /** Whether AI is defending/retreating */
  isRetreating: boolean;
}

/**
 * AI difficulty settings
 * Controls reaction time and decision quality
 */
export interface AIDifficulty {
  /** Minimum time between actions (ms) */
  reactionTime: number;
  /** Chance to use optimal action (0-1) */
  accuracy: number;
  /** Chance to use special when available (0-1) */
  specialUsageRate: number;
}

/**
 * Default difficulty for MVP
 * Balanced for single-player experience
 */
const DEFAULT_DIFFICULTY: AIDifficulty = {
  reactionTime: 500, // 0.5 seconds between actions
  accuracy: 0.7, // 70% optimal decisions
  specialUsageRate: 0.8, // 80% special usage when available
};

/**
 * AI state tracker
 * Maintains AI's decision-making context
 */
interface AIState {
  lastActionTime: number;
  lastDecision: AIDecision;
  targetLastPosition: Vector3;
}

// AI state (simple singleton for MVP)
let aiState: AIState = {
  lastActionTime: 0,
  lastDecision: {
    action: null,
    moveDirection: null,
    isRetreating: false,
  },
  targetLastPosition: new Vector3(),
};

/**
 * Make AI decision based on current game state
 * Main entry point for AI system
 *
 * @param ai - AI actor (opponent)
 * @param player - Player actor
 * @param gauge - AI's gauge value
 * @param cooldowns - AI's action cooldowns
 * @param currentTime - Current game time (ms)
 * @param difficulty - AI difficulty settings
 * @returns AI decision
 */
export function makeAIDecision(
  ai: Actor,
  player: Actor,
  gauge: number,
  cooldowns: Record<ActionType, number>,
  currentTime: number,
  difficulty: AIDifficulty = DEFAULT_DIFFICULTY
): AIDecision {
  // Check reaction time
  if (currentTime - aiState.lastActionTime < difficulty.reactionTime) {
    // Continue previous action
    return aiState.lastDecision;
  }

  // Calculate distance to player
  const distance = getDistance2D(ai.position, player.position);
  const inActionRange = isInActionRange(ai.position, player.position);

  // Calculate direction to player
  const directionToPlayer = new Vector3(
    player.position.x - ai.position.x,
    0,
    player.position.z - ai.position.z
  ).normalize();

  // Decision tree
  let decision: AIDecision;

  // 1. Check if should retreat (low HP)
  if (shouldRetreat(ai, player)) {
    decision = makeRetreatDecision(ai.position, player.position);
  }
  // 2. Check if can use special
  else if (shouldUseSpecial(gauge, inActionRange, cooldowns, difficulty)) {
    decision = {
      action: 'special',
      moveDirection: null,
      isRetreating: false,
    };
  }
  // 3. Check if in action range
  else if (inActionRange) {
    decision = makeAttackDecision(distance, cooldowns, difficulty);
  }
  // 4. Move toward player
  else {
    decision = {
      action: null,
      moveDirection: directionToPlayer,
      isRetreating: false,
    };
  }

  // Update AI state
  aiState.lastActionTime = currentTime;
  aiState.lastDecision = decision;
  aiState.targetLastPosition = player.position.clone();

  return decision;
}

/**
 * Check if AI should retreat
 * Retreats when low on HP
 *
 * @param ai - AI actor
 * @param player - Player actor
 * @returns true if should retreat
 */
function shouldRetreat(ai: Actor, player: Actor): boolean {
  const hpPercent = ai.hp / ai.maxHp;

  // Retreat if HP below 30% and player has more HP
  if (hpPercent < 0.3 && player.hp > ai.hp) {
    return true;
  }

  // Retreat if very low HP (below 20%)
  if (hpPercent < 0.2) {
    return true;
  }

  return false;
}

/**
 * Make retreat decision
 * Move away from player
 *
 * @param aiPos - AI position
 * @param playerPos - Player position
 * @returns Retreat decision
 */
function makeRetreatDecision(aiPos: Vector3, playerPos: Vector3): AIDecision {
  // Direction away from player
  const retreatDirection = new Vector3(
    aiPos.x - playerPos.x,
    0,
    aiPos.z - playerPos.z
  ).normalize();

  return {
    action: null,
    moveDirection: retreatDirection,
    isRetreating: true,
  };
}

/**
 * Check if AI should use special move
 *
 * @param gauge - AI's gauge value
 * @param inRange - Whether player is in action range
 * @param cooldowns - Action cooldowns
 * @param difficulty - AI difficulty
 * @returns true if should use special
 */
function shouldUseSpecial(
  gauge: number,
  inRange: boolean,
  cooldowns: Record<ActionType, number>,
  difficulty: AIDifficulty
): boolean {
  // Must have full gauge and be in range
  if (gauge < 100 || !inRange) {
    return false;
  }

  // Must not be on cooldown
  if (cooldowns.special > 0) {
    return false;
  }

  // Random chance based on difficulty
  return Math.random() < difficulty.specialUsageRate;
}

/**
 * Make attack decision when in range
 * Chooses between push and tsuppari based on cooldowns and accuracy
 *
 * @param distance - Distance to player
 * @param cooldowns - Action cooldowns
 * @param difficulty - AI difficulty
 * @returns Attack decision
 */
function makeAttackDecision(
  distance: number,
  cooldowns: Record<ActionType, number>,
  difficulty: AIDifficulty
): AIDecision {
  // Get available actions
  const canPush = cooldowns.push === 0;
  const canTsuppari = cooldowns.tsuppari === 0;

  // If no actions available, don't attack
  if (!canPush && !canTsuppari) {
    return {
      action: null,
      moveDirection: null,
      isRetreating: false,
    };
  }

  // Decide action based on accuracy
  const isOptimal = Math.random() < difficulty.accuracy;

  let action: ActionType;

  if (isOptimal) {
    // Optimal: Push for damage, tsuppari for speed
    if (canPush && distance < 1.5) {
      // Close range: Push for knockback
      action = 'push';
    } else if (canTsuppari) {
      // Mid range or push on cooldown: Tsuppari
      action = 'tsuppari';
    } else {
      action = 'push';
    }
  } else {
    // Suboptimal: Random choice
    if (canPush && canTsuppari) {
      action = Math.random() < 0.5 ? 'push' : 'tsuppari';
    } else if (canPush) {
      action = 'push';
    } else {
      action = 'tsuppari';
    }
  }

  return {
    action,
    moveDirection: null,
    isRetreating: false,
  };
}

/**
 * Reset AI state
 * Called when starting new game
 */
export function resetAI(): void {
  aiState = {
    lastActionTime: 0,
    lastDecision: {
      action: null,
      moveDirection: null,
      isRetreating: false,
    },
    targetLastPosition: new Vector3(),
  };
}

/**
 * Get AI difficulty preset
 * For future difficulty selection feature
 *
 * @param level - Difficulty level ('easy' | 'normal' | 'hard')
 * @returns AI difficulty settings
 */
export function getAIDifficulty(level: 'easy' | 'normal' | 'hard'): AIDifficulty {
  switch (level) {
    case 'easy':
      return {
        reactionTime: 800,
        accuracy: 0.5,
        specialUsageRate: 0.5,
      };
    case 'normal':
      return DEFAULT_DIFFICULTY;
    case 'hard':
      return {
        reactionTime: 300,
        accuracy: 0.9,
        specialUsageRate: 1.0,
      };
    default:
      return DEFAULT_DIFFICULTY;
  }
}
