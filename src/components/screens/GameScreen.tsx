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
  const { updateCooldowns, executeAction } = useGameActions();
  const gameState = useGameStore();

  // Game loop effect
  useEffect(() => {
    // Reset AI state when game starts
    resetAI();

    let lastTime = performance.now();
    let lastAITime = performance.now();
    const AI_UPDATE_INTERVAL = 500; // Update AI every 500ms

    const gameLoop = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update cooldowns (convert to seconds for calculations)
      updateCooldowns(deltaTime);

      // Update AI periodically
      if (currentTime - lastAITime >= AI_UPDATE_INTERVAL) {
        lastAITime = currentTime;

        // Only update AI if game is ongoing
        if (gameState.gameStatus === 'battle' && gameState.winner === null) {
          // Make AI decision
          const aiDecision = makeAIDecision(
            gameState.opponent,
            gameState.player,
            gameState.gauge,
            gameState.cooldowns,
            currentTime
          );

          // Execute AI action if any
          if (aiDecision.action) {
            executeAction('opponent', aiDecision.action);
          }

          // TODO: AI movement (future enhancement)
          // For MVP, actors stay in place
        }
      }

      // Continue loop if game is active
      if (gameState.gameStatus === 'battle') {
        requestAnimationFrame(gameLoop);
      }
    };

    // Start game loop
    const animationId = requestAnimationFrame(gameLoop);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState.gameStatus, gameState.winner, updateCooldowns, executeAction, gameState]);

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
