/**
 * Game Screen Component
 *
 * Main battle screen combining:
 * - 3D scene (background)
 * - HUD (overlay)
 * - Controls (overlay)
 */

import { useEffect } from 'react';
import GameScene from '../scene/GameScene';
import HUD from '../hud/HUD';
import Controls from '../controls/Controls';
import { useGameActions, useGameStore } from '../../state/gameStore';
import { makeAIDecision, resetAI } from '../../systems/ai';
import { GAME_CONSTANTS } from '../../types/game';

/**
 * Game Screen Props
 */
export interface GameScreenProps {
  /** Optional className */
  className?: string;
}

/**
 * Game Screen Component
 * Complete battle screen with scene, HUD, and controls
 */
export default function GameScreen({ className = '' }: GameScreenProps) {
  const { updateCooldowns, executeAction, setActorPosition } = useGameActions();

  // Game loop effect
  useEffect(() => {
    // Reset AI state when game starts
    resetAI();

    let lastTime = performance.now();
    let lastAITime = performance.now();
    const AI_UPDATE_INTERVAL = 500; // Update AI every 500ms
    let animationId: number;

    const gameLoop = () => {
      const state = useGameStore.getState();
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update cooldowns (convert to seconds for calculations)
      updateCooldowns(deltaTime);

      // Update AI periodically
      if (currentTime - lastAITime >= AI_UPDATE_INTERVAL) {
        lastAITime = currentTime;

        // Only update AI if game is ongoing
        if (state.gameStatus === 'battle' && state.winner === null) {
          // Make AI decision using opponent's gauge
          const aiDecision = makeAIDecision(
            state.opponent,
            state.player,
            state.opponentGauge,
            state.cooldowns,
            currentTime
          );

          // Execute AI action if any
          if (aiDecision.action) {
            executeAction('opponent', aiDecision.action);
          }

          // Execute AI movement if any
          if (aiDecision.moveDirection) {
            const deltaTimeSeconds = deltaTime / 1000; // Convert ms to seconds
            const moveSpeed = GAME_CONSTANTS.MOVEMENT_SPEED;
            const movement = aiDecision.moveDirection
              .clone()
              .multiplyScalar(moveSpeed * deltaTimeSeconds);
            const newPosition = state.opponent.position.clone().add(movement);
            setActorPosition('opponent', newPosition);
          }
        }
      }

      // Continue loop if game is active
      if (state.gameStatus === 'battle') {
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    // Start game loop
    animationId = requestAnimationFrame(gameLoop);

    // Cleanup on unmount
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [updateCooldowns, executeAction, setActorPosition]);

  return (
    <div className={`full-screen ${className}`} style={{ position: 'relative' }}>
      {/* 3D Scene (background) */}
      <GameScene />

      {/* HUD (overlay) */}
      <HUD />

      {/* Controls (overlay) */}
      <Controls />
    </div>
  );
}
