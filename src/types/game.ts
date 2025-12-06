/**
 * Game Type Definitions
 *
 * Core types for tonton sumo physics-based battle game.
 * These types define the "studs" (interfaces) that all modules connect to.
 *
 * Based on TECHNICAL_DESIGN.md specification.
 */

import type { Vector3, Euler } from 'three';

/**
 * Re-export PhysicsState from physics engine for convenience
 */
export type { PhysicsState } from '../physics/tontonzumo-physics';

/**
 * Game screen/status enum
 */
export type GameStatus = 'title' | 'battle' | 'result';

/**
 * Winner enum
 * Indicates who won the match
 */
export type Winner = 'player' | 'opponent' | null;

/**
 * TapTracker interface (placeholder - will be implemented in Chunk 2)
 * Tracks tap rate using 1-second sliding window
 */
export interface TapTracker {
  addTap(timestamp?: number): void;
  getTapRate(): number;
  reset(): void;
}

/**
 * Game state interface
 * Complete game state managed by Zustand store
 *
 * Note: This is the TYPE definition. The actual store implementation
 * with actions (executeTap, updatePhysics, etc.) is in state/gameStore.ts
 */
export interface GameState {
  /** Player's sumo wrestler physics state */
  player: {
    position: Vector3;
    velocity: Vector3;
    angularVelocity: number;
    rotation: Euler;
    tipping: number;
    isFallen: boolean;
  };

  /** AI opponent's sumo wrestler physics state */
  opponent: {
    position: Vector3;
    velocity: Vector3;
    angularVelocity: number;
    rotation: Euler;
    tipping: number;
    isFallen: boolean;
  };

  /** Current game screen/status */
  gameStatus: GameStatus;

  /** Winner of the match (null if ongoing) */
  winner: Winner;

  /** Tap tracker for measuring tap rate (Chunk 2) */
  tapTracker?: TapTracker;

  // Actions (implemented in gameStore.ts - Chunk 3)
  executeTap?: () => void;
  updatePhysics?: (deltaTime: number) => void;
  checkVictory?: () => void;
  resetGame?: () => void;
}

/**
 * Ring specifications
 * Re-exported from physics constants for convenience
 */
export const RING_SPECS = {
  /** Ring radius in units (matches PHYSICS_CONSTANTS.RING_RADIUS) */
  radius: 4.5,

  /** Ring height (visual only) */
  height: 0.1,
} as const;
