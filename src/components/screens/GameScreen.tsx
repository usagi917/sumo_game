/**
 * Game Screen Component
 *
 * Main battle screen for gauge-based sumo battle.
 * - 3D scene (background)
 * - HUD with HP, Gauge, Rank (overlay)
 * - Ton button (overlay)
 */

import React, { useEffect, useRef } from 'react';
import GameScene from '../scene/GameScene';
import HUD from '../hud/HUD';
import { TonButton } from '../controls/TonButton';
import { useGameActions, useGameStore } from '../../state/gameStore';
import { useRankingStore } from '../../state/rankingStore';
import { AIEngine } from '../../systems/ai';
import { playCollisionSound, playStartSound, resumeAudio } from '../../systems/sound';
import { PHYSICS_CONSTANTS } from '../../physics/constants';

export interface GameScreenProps {
  className?: string;
}

// AI engine singleton
const aiEngine = new AIEngine();

export default function GameScreen({ className = '' }: GameScreenProps) {
  const { updatePhysics, executeAITap } = useGameActions();
  const currentRank = useRankingStore((state) => state.currentRank);
  const lastCollisionTime = useRef(0);

  // Play start sound when battle begins
  useEffect(() => {
    resumeAudio();
    playStartSound();
  }, []);

  // Game loop
  useEffect(() => {
    aiEngine.reset();
    aiEngine.setRank(currentRank);

    let lastTime = performance.now();
    let animationId: number;

    const gameLoop = () => {
      const state = useGameStore.getState();
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (state.gameStatus === 'battle') {
        // Update physics
        updatePhysics(deltaTime);

        // Collision sound (throttled)
        const playerPos = state.player.position;
        const opponentPos = state.opponent.position;
        const distance = Math.sqrt(
          (opponentPos.x - playerPos.x) ** 2 +
          (opponentPos.z - playerPos.z) ** 2
        );

        if (distance < PHYSICS_CONSTANTS.COLLISION_THRESHOLD) {
          if (currentTime - lastCollisionTime.current > 200) {
            playCollisionSound();
            lastCollisionTime.current = currentTime;
          }
        }

        // AI taps during charging phase
        if (state.battlePhase === 'charging') {
          const aiDecision = aiEngine.decide(currentTime);
          if (aiDecision.shouldTap) {
            executeAITap();
          }
        }
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [updatePhysics, executeAITap, currentRank]);

  return (
    <div className={`full-screen ${className}`} style={{ position: 'relative' }}>
      {/* 3D Scene */}
      <GameScene />

      {/* HUD */}
      <HUD />

      {/* Ton Button */}
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
