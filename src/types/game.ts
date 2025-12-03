/**
 * Game Type Definitions
 *
 * Core types for the retro sumo battle game MVP.
 * These types define the "studs" (interfaces) that all modules connect to.
 */

import type { Vector3 } from 'three';

/**
 * Actor state enum
 * Represents the current state of a sumo wrestler
 */
export type ActorState = 'idle' | 'attacking' | 'damaged' | 'defeated';

/**
 * Action type enum
 * MVP actions: push, tsuppari, special
 */
export type ActionType = 'push' | 'tsuppari' | 'special';

/**
 * Game screen/status enum
 * MVP screens: title, battle, result
 */
export type GameStatus = 'title' | 'battle' | 'result';

/**
 * Winner enum
 * Indicates who won the match
 */
export type Winner = 'player' | 'opponent' | null;

/**
 * Actor interface
 * Represents a sumo wrestler (player or AI opponent)
 * MVP version uses fixed stats - no training/leveling system
 */
export interface Actor {
  /** Unique identifier for this actor */
  id: string;

  /** 3D position in the scene */
  position: Vector3;

  /** Current HP (0-100) */
  hp: number;

  /** Maximum HP (fixed at 100 for MVP) */
  maxHp: number;

  /** Current state of the actor */
  state: ActorState;
}

/**
 * Game state interface
 * Complete game state managed by Zustand store
 */
export interface GameState {
  /** Player's sumo wrestler */
  player: Actor;

  /** AI opponent's sumo wrestler */
  opponent: Actor;

  /** Special move gauge (0-100) */
  gauge: number;

  /** Cooldowns for each action type (milliseconds remaining) */
  cooldowns: Record<ActionType, number>;

  /** Current game screen/status */
  gameStatus: GameStatus;

  /** Winner of the match (null if ongoing) */
  winner: Winner;

  /** Ring radius for ring-out detection (4.5 units) */
  ringRadius: number;
}

/**
 * Action damage values (fixed for MVP)
 */
export const ACTION_DAMAGE: Record<ActionType, number> = {
  push: 10,
  tsuppari: 3,
  special: 30,
};

/**
 * Action knockback force values
 */
export const ACTION_KNOCKBACK: Record<ActionType, number> = {
  push: 2.0,
  tsuppari: 0.3,
  special: 5.0,
};

/**
 * Action cooldown durations (milliseconds)
 */
export const ACTION_COOLDOWNS: Record<ActionType, number> = {
  push: 300,
  tsuppari: 200,
  special: 0, // No cooldown, only gauge requirement
};

/**
 * Gauge increase amounts
 */
export const GAUGE_INCREASE = {
  /** Gauge increase on hitting opponent */
  onHit: 10,

  /** Gauge increase when hit by opponent */
  onDamaged: 5,
} as const;

/**
 * Ring specifications
 */
export const RING_SPECS = {
  /** Ring radius in units */
  radius: 4.5,

  /** Ring height (visual only) */
  height: 0.1,

  /** Distance threshold for ring-out */
  fallThreshold: 5.0,
} as const;

/**
 * Game constants
 */
export const GAME_CONSTANTS = {
  /** Fixed HP for all actors in MVP */
  FIXED_HP: 100,

  /** Gauge required to use special move */
  SPECIAL_GAUGE_COST: 100,

  /** Movement speed (units per second) */
  MOVEMENT_SPEED: 3.0,
} as const;
