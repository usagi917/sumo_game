/**
 * HUD (Heads-Up Display) Component
 *
 * Complete game HUD showing:
 * - Player HP (left)
 * - Opponent HP (right)
 * - Gauge (center bottom)
 *
 * Retro 8-bit styling
 */

import HPBar from './HPBar';
import GaugeBar from './GaugeBar';
import { usePlayer, useOpponent, usePlayerGauge } from '../../state/gameStore';

/**
 * HUD Props
 */
export interface HUDProps {
  /** Optional className for positioning */
  className?: string;
}

/**
 * Complete HUD Component
 * Overlays game screen with HP bars and gauge
 */
export default function HUD({ className = '' }: HUDProps) {
  const player = usePlayer();
  const opponent = useOpponent();
  const gauge = usePlayerGauge();

  return (
    <div className={`hud-overlay ${className}`}>
      {/* Top row: HP bars */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: 'var(--spacing-md)',
          gap: 'var(--spacing-md)',
        }}
      >
        {/* Player HP (left) */}
        <HPBar hp={player.hp} maxHp={player.maxHp} label="あなた" />

        {/* Opponent HP (right) */}
        <HPBar hp={opponent.hp} maxHp={opponent.maxHp} label="あいて" />
      </div>

      {/* Bottom center: Gauge - positioned above controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          maxWidth: '320px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <GaugeBar gauge={gauge} />
      </div>
    </div>
  );
}
