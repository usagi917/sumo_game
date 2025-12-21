/**
 * Game State Store
 *
 * Zustand store managing all game state for tonton sumo gauge-based battle.
 * New system: Tap to charge gauge → 100% triggers special move → HP damage
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
} from '../physics/tontonzumo-physics';

/**
 * Special move types
 */
export type SpecialMove = 'harite' | 'tsuppari' | 'buchikami';

/**
 * Battle phase within a round
 */
export type BattlePhase = 'charging' | 'special' | 'hit' | 'ko';

/**
 * Fighter state (extends PhysicsState with battle stats)
 */
interface FighterState extends PhysicsState {
  hp: number;
  gauge: number; // 0-100
  isExecutingSpecial: boolean;
  specialMove: SpecialMove | null;
  specialStartTime: number | null;
}

/**
 * Game state interface
 */
interface GameState {
  player: FighterState;
  opponent: FighterState;
  gameStatus: GameStatus;
  battlePhase: BattlePhase;
  winner: Winner;
  tapTracker: TapTracker;
  // Track who triggered special first for priority
  specialPriority: 'player' | 'opponent' | 'simultaneous' | null;
}

/**
 * Store actions interface
 */
interface GameActions {
  executeTap: () => void;
  executeAITap: () => void;
  updatePhysics: (deltaTime: number) => void;
  checkSpecialTrigger: () => void;
  resolveSpecialMoves: () => void;
  checkVictory: () => void;
  resetRound: () => void;
  resetGame: () => void;
  startNewGame: () => void;
  setGameStatus: (status: GameStatus) => void;
  setWinner: (winner: Winner) => void;
}

type GameStore = GameState & GameActions;

/**
 * Constants
 */
const MAX_HP = 3;
const GAUGE_PER_TAP = 8; // Each tap adds 8% gauge
const SPECIAL_DURATION = 800; // ms for special move animation

/**
 * Get random special move
 */
const getRandomSpecialMove = (): SpecialMove => {
  const moves: SpecialMove[] = ['harite', 'tsuppari', 'buchikami'];
  return moves[Math.floor(Math.random() * moves.length)];
};

/**
 * Create initial FighterState
 */
const createFighterState = (z: number): FighterState => ({
  position: new Vector3(0, 0, z),
  velocity: new Vector3(0, 0, 0),
  angularVelocity: 0,
  rotation: new Euler(0, 0, 0),
  tipping: 0,
  isFallen: false,
  hp: MAX_HP,
  gauge: 0,
  isExecutingSpecial: false,
  specialMove: null,
  specialStartTime: null,
});

/**
 * Initial state factory
 */
const createInitialState = (): GameState => ({
  player: createFighterState(3),
  opponent: createFighterState(-3),
  gameStatus: 'title',
  battlePhase: 'charging',
  winner: null,
  tapTracker: new TapTracker(),
  specialPriority: null,
});

/**
 * Game Store
 */
export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  /**
   * Player tap - charges gauge and applies physics
   */
  executeTap: () => {
    const state = get();
    if (state.gameStatus !== 'battle' || state.battlePhase !== 'charging') {
      return;
    }
    if (state.player.isExecutingSpecial) {
      return;
    }

    state.tapTracker.addTap();
    const newPlayer = applyTapForce(state.player, state.tapTracker.getTapRate());

    // Add gauge
    const newGauge = Math.min(100, state.player.gauge + GAUGE_PER_TAP);

    set({
      player: {
        ...newPlayer,
        gauge: newGauge,
      },
    });

    // Check if special triggered
    get().checkSpecialTrigger();
  },

  /**
   * AI tap - charges AI gauge and applies physics
   */
  executeAITap: () => {
    const state = get();
    if (state.gameStatus !== 'battle' || state.battlePhase !== 'charging') {
      return;
    }
    if (state.opponent.isExecutingSpecial) {
      return;
    }

    const newOpponent = applyTapForce(state.opponent, 2); // AI tap rate

    // Add gauge
    const newGauge = Math.min(100, state.opponent.gauge + GAUGE_PER_TAP);

    set({
      opponent: {
        ...newOpponent,
        gauge: newGauge,
      },
    });

    // Check if special triggered
    get().checkSpecialTrigger();
  },

  /**
   * Check if either fighter hits 100% gauge
   */
  checkSpecialTrigger: () => {
    const state = get();
    const now = Date.now();

    const playerReady = state.player.gauge >= 100 && !state.player.isExecutingSpecial;
    const opponentReady = state.opponent.gauge >= 100 && !state.opponent.isExecutingSpecial;

    if (!playerReady && !opponentReady) return;

    let newPlayer = { ...state.player };
    let newOpponent = { ...state.opponent };
    let priority = state.specialPriority;

    // Determine priority
    if (playerReady && opponentReady) {
      // Simultaneous!
      priority = 'simultaneous';
      newPlayer = {
        ...newPlayer,
        isExecutingSpecial: true,
        specialMove: getRandomSpecialMove(),
        specialStartTime: now,
      };
      newOpponent = {
        ...newOpponent,
        isExecutingSpecial: true,
        specialMove: getRandomSpecialMove(),
        specialStartTime: now,
      };
    } else if (playerReady) {
      priority = priority ?? 'player';
      newPlayer = {
        ...newPlayer,
        isExecutingSpecial: true,
        specialMove: getRandomSpecialMove(),
        specialStartTime: now,
      };
    } else if (opponentReady) {
      priority = priority ?? 'opponent';
      newOpponent = {
        ...newOpponent,
        isExecutingSpecial: true,
        specialMove: getRandomSpecialMove(),
        specialStartTime: now,
      };
    }

    set({
      player: newPlayer,
      opponent: newOpponent,
      battlePhase: 'special',
      specialPriority: priority,
    });
  },

  /**
   * Resolve special moves after animation
   */
  resolveSpecialMoves: () => {
    const state = get();
    if (state.battlePhase !== 'special') return;

    const now = Date.now();
    const playerDone = state.player.specialStartTime &&
      now - state.player.specialStartTime >= SPECIAL_DURATION;
    const opponentDone = state.opponent.specialStartTime &&
      now - state.opponent.specialStartTime >= SPECIAL_DURATION;

    // Wait for all active specials to complete
    if (state.player.isExecutingSpecial && !playerDone) return;
    if (state.opponent.isExecutingSpecial && !opponentDone) return;

    // Apply damage based on priority
    let newPlayerHp = state.player.hp;
    let newOpponentHp = state.opponent.hp;

    if (state.specialPriority === 'simultaneous') {
      // Both triggered at same time - no damage
      // (相殺)
    } else if (state.specialPriority === 'player') {
      // Player hit first
      newOpponentHp -= 1;
    } else if (state.specialPriority === 'opponent') {
      // Opponent hit first
      newPlayerHp -= 1;
    }

    // Reset for next round
    set({
      player: {
        ...createFighterState(3),
        hp: newPlayerHp,
      },
      opponent: {
        ...createFighterState(-3),
        hp: newOpponentHp,
      },
      battlePhase: newPlayerHp <= 0 || newOpponentHp <= 0 ? 'ko' : 'charging',
      specialPriority: null,
    });

    // Check for KO
    get().checkVictory();
  },

  /**
   * Update physics simulation
   */
  updatePhysics: (deltaTime: number) => {
    const state = get();
    if (state.gameStatus !== 'battle') return;

    // Update physics for both fighters
    const newPlayer = updateActorPhysics(state.player, deltaTime);
    const newOpponent = updateActorPhysics(state.opponent, deltaTime);

    // Collision
    resolveCollision(newPlayer, newOpponent);

    set({
      player: { ...state.player, ...newPlayer },
      opponent: { ...state.opponent, ...newOpponent },
    });

    // Resolve specials if in special phase
    if (state.battlePhase === 'special') {
      get().resolveSpecialMoves();
    }
  },

  /**
   * Check victory conditions
   */
  checkVictory: () => {
    const state = get();
    if (state.gameStatus !== 'battle') return;

    if (state.player.hp <= 0) {
      set({ winner: 'opponent', gameStatus: 'result' });
    } else if (state.opponent.hp <= 0) {
      set({ winner: 'player', gameStatus: 'result' });
    }
  },

  /**
   * Reset round (after special move resolves)
   */
  resetRound: () => {
    const state = get();
    set({
      player: {
        ...createFighterState(3),
        hp: state.player.hp,
      },
      opponent: {
        ...createFighterState(-3),
        hp: state.opponent.hp,
      },
      battlePhase: 'charging',
      specialPriority: null,
    });
  },

  /**
   * Reset entire game
   */
  resetGame: () => {
    set(createInitialState());
  },

  /**
   * Start new game
   */
  startNewGame: () => {
    set({
      ...createInitialState(),
      gameStatus: 'battle',
    });
  },

  setGameStatus: (status: GameStatus) => set({ gameStatus: status }),
  setWinner: (winner: Winner) => set({ winner }),
}));

/**
 * Selector hooks
 */
export const usePlayer = () => useGameStore((state) => state.player);
export const useOpponent = () => useGameStore((state) => state.opponent);
export const useGameStatus = () => useGameStore((state) => state.gameStatus);
export const useBattlePhase = () => useGameStore((state) => state.battlePhase);
export const useWinner = () => useGameStore((state) => state.winner);
export const useTapTracker = () => useGameStore((state) => state.tapTracker);
export const useSpecialPriority = () => useGameStore((state) => state.specialPriority);

export const useGameActions = () =>
  useGameStore((state) => ({
    executeTap: state.executeTap,
    executeAITap: state.executeAITap,
    updatePhysics: state.updatePhysics,
    checkVictory: state.checkVictory,
    resetGame: state.resetGame,
    resetRound: state.resetRound,
    startNewGame: state.startNewGame,
    setGameStatus: state.setGameStatus,
    setWinner: state.setWinner,
  }));
