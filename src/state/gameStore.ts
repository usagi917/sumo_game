/**
 * Game State Store
 *
 * Zustand store managing all game state for tonton sumo physics-based battle.
 * Based on TECHNICAL_DESIGN.md specification.
 */

import { create } from 'zustand';
import { Vector3, Euler } from 'three';
import type { PhysicsState } from '../types/game';
import type { GameStatus, Winner } from '../types/game';
import { TapTracker } from '../systems/tap-tracker';
import {
  updateActorPhysics,
  applyTapForce,
  resolveCollision,
  isRingOut,
} from '../physics/tontonzumo-physics';
import { RING_SPECS } from '../types/game';

/**
 * Game state interface
 */
interface GameState {
  player: PhysicsState;
  opponent: PhysicsState;
  gameStatus: GameStatus;
  winner: Winner;
  tapTracker: TapTracker;
}

/**
 * Store actions interface
 */
interface GameActions {
  // Core actions (from TECHNICAL_DESIGN.md)
  executeTap: () => void;
  updatePhysics: (deltaTime: number) => void;
  checkVictory: () => void;
  resetGame: () => void;

  // Lifecycle actions
  startNewGame: () => void;
  setGameStatus: (status: GameStatus) => void;
  setWinner: (winner: Winner) => void;
}

/**
 * Complete store type
 */
type GameStore = GameState & GameActions;

/**
 * Create initial PhysicsState for an actor
 */
const createPhysicsState = (x: number, z: number): PhysicsState => ({
  position: new Vector3(x, 0, z),
  velocity: new Vector3(0, 0, 0),
  angularVelocity: 0,
  rotation: new Euler(0, 0, 0),
  tipping: 0,
  isFallen: false,
});

/**
 * Initial state factory
 */
const createInitialState = (): GameState => ({
  player: createPhysicsState(-1, 0),
  opponent: createPhysicsState(1, 0),
  gameStatus: 'title',
  winner: null,
  tapTracker: new TapTracker(),
});

/**
 * Game Store
 * Zustand store with all game state and actions
 */
export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  ...createInitialState(),

  // Core action: Execute tap (player presses "トン!" button)
  executeTap: () => {
    const state = get();

    // Only allow taps during battle
    if (state.gameStatus !== 'battle') {
      return;
    }

    // Record tap
    state.tapTracker.addTap();

    // Apply tap force to player
    applyTapForce(state.player, state.tapTracker.getTapRate());
  },

  // Core action: Update physics simulation
  updatePhysics: (deltaTime: number) => {
    const state = get();

    // Only update during battle
    if (state.gameStatus !== 'battle') {
      return;
    }

    // Update both actors' physics
    const newPlayer = updateActorPhysics(state.player, deltaTime);
    const newOpponent = updateActorPhysics(state.opponent, deltaTime);

    // Resolve collision between actors
    resolveCollision(newPlayer, newOpponent);

    // Update state
    set({
      player: newPlayer,
      opponent: newOpponent,
    });

    // Check victory conditions
    get().checkVictory();
  },

  // Core action: Check victory conditions
  checkVictory: () => {
    const state = get();

    // Only check during battle
    if (state.gameStatus !== 'battle') {
      return;
    }

    // Check player loss conditions
    if (state.player.isFallen || isRingOut(state.player.position)) {
      set({
        winner: 'opponent',
        gameStatus: 'result',
      });
      return;
    }

    // Check opponent loss conditions
    if (state.opponent.isFallen || isRingOut(state.opponent.position)) {
      set({
        winner: 'player',
        gameStatus: 'result',
      });
      return;
    }
  },

  // Core action: Reset game
  resetGame: () => {
    set(createInitialState());
  },

  // Lifecycle actions
  startNewGame: () => {
    set(createInitialState());
    set({ gameStatus: 'battle' });
  },

  setGameStatus: (status: GameStatus) => {
    set({ gameStatus: status });
  },

  setWinner: (winner: Winner) => {
    set({ winner });
  },
}));

/**
 * Selector hooks for specific state slices
 * Optimizes re-renders by subscribing to only needed state
 */

/** Get player physics state */
export const usePlayer = () => useGameStore((state) => state.player);

/** Get opponent physics state */
export const useOpponent = () => useGameStore((state) => state.opponent);

/** Get game status */
export const useGameStatus = () => useGameStore((state) => state.gameStatus);

/** Get winner */
export const useWinner = () => useGameStore((state) => state.winner);

/** Get tap tracker */
export const useTapTracker = () => useGameStore((state) => state.tapTracker);

/** Get all core actions */
export const useGameActions = () =>
  useGameStore((state) => ({
    executeTap: state.executeTap,
    updatePhysics: state.updatePhysics,
    checkVictory: state.checkVictory,
    resetGame: state.resetGame,
    startNewGame: state.startNewGame,
    setGameStatus: state.setGameStatus,
    setWinner: state.setWinner,
  }));
