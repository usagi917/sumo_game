/**
 * Game Screen Component
 *
 * Main battle screen combining:
 * - 3D scene (background)
 * - HUD (overlay)
 * - Controls (overlay)
 *
 * Based on TECHNICAL_DESIGN.md specification.
 */

import React, { useEffect } from 'react';
import GameScene from '../scene/GameScene';
import HUD from '../hud/HUD';
import { TonButton } from '../controls/TonButton';
import { useGameActions, useGameStore } from '../../state/gameStore';
import { AIEngine } from '../../systems/ai';
import { applyTapForce } from '../../physics/tontonzumo-physics';

/**
 * Game Screen Props
 */
export interface GameScreenProps {
  /** Optional className */
  className?: string;
}

// AI engine instance (singleton for game)
const aiEngine = new AIEngine();

/**
 * Game Screen Component
 * Complete battle screen with physics-based game loop
 */
export default function GameScreen({ className = '' }: GameScreenProps) {
  const { updatePhysics } = useGameActions();

  // Physics game loop effect
  useEffect(() => {
    // Reset AI state when game starts
    aiEngine.reset();

    let lastTime = performance.now();
    let animationId: number;

    const gameLoop = () => {
      const state = useGameStore.getState();
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Only update during battle
      if (state.gameStatus === 'battle') {
        // Update physics simulation
        updatePhysics(deltaTime);

        // Update AI
        const aiDecision = aiEngine.decide(
          state.opponent,
          state.player,
          currentTime
        );

        if (aiDecision.shouldTap) {
          // AI executes tap - update opponent state
          const newOpponent = applyTapForce(state.opponent, aiDecision.tapRate);
          useGameStore.setState({ opponent: newOpponent });
        }
      }

      // Continue loop regardless of game status
      animationId = requestAnimationFrame(gameLoop);
    };

    // Start game loop
    animationId = requestAnimationFrame(gameLoop);

    // Cleanup on unmount
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [updatePhysics]);

  return (
    <div className={`full-screen ${className}`} style={{ position: 'relative' }}>
      {/* 3D Scene (background) */}
      <GameScene />

      {/* HUD (overlay) */}
      <HUD />

      {/* Controls (overlay) - positioned at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <TonButton />
      </div>
    </div>
  );
}
