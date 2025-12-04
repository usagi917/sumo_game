/**
 * Game State Store
 *
 * Zustand store managing all game state for the retro sumo battle MVP.
 * Provides centralized state management with clean action methods.
 */

import { create } from 'zustand';
import { Vector3 } from 'three';
import type {
  Actor,
  GameState,
  ActionType,
  GameStatus,
  Winner,
} from '../types/game';
import {
  GAME_CONSTANTS,
  ACTION_DAMAGE,
  ACTION_KNOCKBACK,
  ACTION_COOLDOWNS,
  GAUGE_INCREASE,
  RING_SPECS,
} from '../types/game';

/**
 * Store actions interface
 * All methods that modify game state
 */
interface GameActions {
  // Game lifecycle
  /** Initialize new game */
  startNewGame: () => void;
  /** Set game status */
  setGameStatus: (status: GameStatus) => void;
  /** Set winner */
  setWinner: (winner: Winner) => void;

  // Actor state
  /** Update actor state */
  setActorState: (actorId: 'player' | 'opponent', state: Actor['state']) => void;
  /** Update actor position */
  setActorPosition: (actorId: 'player' | 'opponent', position: Vector3) => void;

  // Combat
  /** Apply damage to actor */
  applyDamage: (actorId: 'player' | 'opponent', damage: number) => void;
  /** Apply knockback to actor */
  applyKnockback: (actorId: 'player' | 'opponent', direction: Vector3, force: number) => void;
  /** Execute action from attacker to target */
  executeAction: (attacker: 'player' | 'opponent', action: ActionType) => void;

  // Gauge
  /** Increase gauge for specific actor */
  increaseGauge: (actorId: 'player' | 'opponent', amount: number) => void;
  /** Consume gauge for specific actor's special move */
  consumeGauge: (actorId: 'player' | 'opponent', amount: number) => void;

  // Cooldowns
  /** Set cooldown for action */
  setCooldown: (action: ActionType, duration: number) => void;
  /** Update cooldowns (call each frame) */
  updateCooldowns: (deltaTime: number) => void;

  // Ring-out detection
  /** Check if actor is out of ring */
  checkRingOut: (actorId: 'player' | 'opponent') => boolean;
}

/**
 * Complete store type
 */
type GameStore = GameState & GameActions;

/**
 * Initial actor factory
 */
const createActor = (id: string, position: Vector3): Actor => ({
  id,
  position,
  hp: GAME_CONSTANTS.FIXED_HP,
  maxHp: GAME_CONSTANTS.FIXED_HP,
  state: 'idle',
});

/**
 * Initial state factory
 */
const createInitialState = (): GameState => ({
  player: createActor('player', new Vector3(-2, 0, 0)),
  opponent: createActor('opponent', new Vector3(2, 0, 0)),
  playerGauge: 0,
  opponentGauge: 0,
  cooldowns: {
    push: 0,
    tsuppari: 0,
    special: 0,
  },
  gameStatus: 'title',
  winner: null,
  ringRadius: RING_SPECS.radius,
});

/**
 * Game Store
 * Zustand store with all game state and actions
 */
export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  ...createInitialState(),

  // Game lifecycle actions
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

  // Actor state actions
  setActorState: (actorId: 'player' | 'opponent', state: Actor['state']) => {
    set((prev) => ({
      [actorId]: { ...prev[actorId], state },
    }));
  },

  setActorPosition: (actorId: 'player' | 'opponent', position: Vector3) => {
    set((prev) => ({
      [actorId]: { ...prev[actorId], position: position.clone() },
    }));
  },

  // Combat actions
  applyDamage: (actorId: 'player' | 'opponent', damage: number) => {
    const state = get();
    const actor = state[actorId];
    const newHp = Math.max(0, actor.hp - damage);

    set((prev) => ({
      [actorId]: { ...prev[actorId], hp: newHp },
    }));

    // Check for defeat
    if (newHp === 0) {
      get().setActorState(actorId, 'defeated');
      get().setWinner(actorId === 'player' ? 'opponent' : 'player');
      get().setGameStatus('result');
    }
  },

  applyKnockback: (actorId: 'player' | 'opponent', direction: Vector3, force: number) => {
    const state = get();
    const actor = state[actorId];
    const knockback = direction.clone().normalize().multiplyScalar(force);
    const newPosition = actor.position.clone().add(knockback);

    get().setActorPosition(actorId, newPosition);

    // Check ring-out
    if (get().checkRingOut(actorId)) {
      get().setActorState(actorId, 'defeated');
      get().setWinner(actorId === 'player' ? 'opponent' : 'player');
      get().setGameStatus('result');
    }
  },

  executeAction: (attacker: 'player' | 'opponent', action: ActionType) => {
    const state = get();
    const target = attacker === 'player' ? 'opponent' : 'player';
    const attackerGauge = attacker === 'player' ? state.playerGauge : state.opponentGauge;

    // Check cooldown
    if (state.cooldowns[action] > 0) {
      return;
    }

    // Check gauge for special
    if (action === 'special' && attackerGauge < GAME_CONSTANTS.SPECIAL_GAUGE_COST) {
      return;
    }

    // Set attacker state
    get().setActorState(attacker, 'attacking');

    // Apply damage
    const damage = ACTION_DAMAGE[action];
    get().applyDamage(target, damage);

    // Apply knockback
    const attackerPos = state[attacker].position;
    const targetPos = state[target].position;
    const direction = targetPos.clone().sub(attackerPos).normalize();
    const knockbackForce = ACTION_KNOCKBACK[action];
    get().applyKnockback(target, direction, knockbackForce);

    // Update attacker's gauge
    if (action !== 'special') {
      get().increaseGauge(attacker, GAUGE_INCREASE.onHit);
    } else {
      get().consumeGauge(attacker, GAME_CONSTANTS.SPECIAL_GAUGE_COST);
    }

    // Set target state and update target's gauge if not defeated
    if (state[target].state !== 'defeated') {
      get().setActorState(target, 'damaged');
      get().increaseGauge(target, GAUGE_INCREASE.onDamaged);
    }

    // Set cooldown
    const cooldown = ACTION_COOLDOWNS[action];
    if (cooldown > 0) {
      get().setCooldown(action, cooldown);
    }

    // Reset attacker state after animation
    setTimeout(() => {
      const currentState = get()[attacker].state;
      if (currentState === 'attacking') {
        get().setActorState(attacker, 'idle');
      }
    }, 300);

    // Reset target state after damage animation
    setTimeout(() => {
      const currentState = get()[target].state;
      if (currentState === 'damaged') {
        get().setActorState(target, 'idle');
      }
    }, 200);
  },

  // Gauge actions
  increaseGauge: (actorId: 'player' | 'opponent', amount: number) => {
    const gaugeKey = actorId === 'player' ? 'playerGauge' : 'opponentGauge';
    set((prev) => ({
      [gaugeKey]: Math.min(100, prev[gaugeKey] + amount),
    }));
  },

  consumeGauge: (actorId: 'player' | 'opponent', amount: number) => {
    const gaugeKey = actorId === 'player' ? 'playerGauge' : 'opponentGauge';
    set((prev) => ({
      [gaugeKey]: Math.max(0, prev[gaugeKey] - amount),
    }));
  },

  // Cooldown actions
  setCooldown: (action: ActionType, duration: number) => {
    set((prev) => ({
      cooldowns: {
        ...prev.cooldowns,
        [action]: duration,
      },
    }));
  },

  updateCooldowns: (deltaTime: number) => {
    set((prev) => ({
      cooldowns: {
        push: Math.max(0, prev.cooldowns.push - deltaTime),
        tsuppari: Math.max(0, prev.cooldowns.tsuppari - deltaTime),
        special: Math.max(0, prev.cooldowns.special - deltaTime),
      },
    }));
  },

  // Ring-out detection
  checkRingOut: (actorId: 'player' | 'opponent') => {
    const state = get();
    const actor = state[actorId];
    const distanceFromCenter = Math.sqrt(
      actor.position.x ** 2 + actor.position.z ** 2
    );
    return distanceFromCenter > state.ringRadius;
  },
}));

/**
 * Selector hooks for specific state slices
 * Optimizes re-renders by subscribing to only needed state
 */

/** Get player actor */
export const usePlayer = () => useGameStore((state) => state.player);

/** Get opponent actor */
export const useOpponent = () => useGameStore((state) => state.opponent);

/** Get player's gauge value */
export const usePlayerGauge = () => useGameStore((state) => state.playerGauge);

/** Get opponent's gauge value */
export const useOpponentGauge = () => useGameStore((state) => state.opponentGauge);

/** Get cooldowns */
export const useCooldowns = () => useGameStore((state) => state.cooldowns);

/** Get game status */
export const useGameStatus = () => useGameStore((state) => state.gameStatus);

/** Get winner */
export const useWinner = () => useGameStore((state) => state.winner);

/** Get all actions */
export const useGameActions = () =>
  useGameStore((state) => ({
    startNewGame: state.startNewGame,
    setGameStatus: state.setGameStatus,
    setWinner: state.setWinner,
    setActorState: state.setActorState,
    setActorPosition: state.setActorPosition,
    applyDamage: state.applyDamage,
    applyKnockback: state.applyKnockback,
    executeAction: state.executeAction,
    increaseGauge: state.increaseGauge,
    consumeGauge: state.consumeGauge,
    setCooldown: state.setCooldown,
    updateCooldowns: state.updateCooldowns,
    checkRingOut: state.checkRingOut,
  }));
