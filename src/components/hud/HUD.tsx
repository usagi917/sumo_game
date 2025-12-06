/**
 * HUD (Heads-Up Display) Component
 *
 * Complete game HUD showing:
 * - Player tipping indicator (left)
 * - Opponent tipping indicator (right)
 *
 * Retro 8-bit styling
 * Based on TECHNICAL_DESIGN.md specification.
 */

import React from 'react';
import { TippingIndicator } from './TippingIndicator';
import { usePlayer, useOpponent } from '../../state/gameStore';

/**
 * HUD Props
 */
export interface HUDProps {
  /** Optional className for positioning */
  className?: string;
}

/**
 * Complete HUD Component
 * Overlays game screen with tipping indicators
 */
export default function HUD({ className = '' }: HUDProps) {
  const player = usePlayer();
  const opponent = useOpponent();

  return (
    <div className={`hud-overlay ${className}`}>
      {/* Top row: Tipping indicators */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: 'var(--spacing-md, 16px)',
          gap: 'var(--spacing-md, 16px)',
        }}
      >
        {/* Player tipping (left) */}
        <TippingIndicator actor={player} label="あなた" />

        {/* Opponent tipping (right) */}
        <TippingIndicator actor={opponent} label="あいて" />
      </div>
    </div>
  );
}
