/**
 * Controls Component
 *
 * Complete control interface with all action buttons
 * Layout: 3 buttons (Push, Tsuppari, Special) in a row
 */

import ActionButton from './ActionButton';
import { useGameActions, useCooldowns, usePlayerGauge } from '../../state/gameStore';
import type { ActionType } from '../../types/game';

/**
 * Controls Props
 */
export interface ControlsProps {
  /** Optional className for positioning */
  className?: string;
}

/**
 * Controls Component
 * Complete action button interface for player
 */
export default function Controls({ className = '' }: ControlsProps) {
  const { executeAction } = useGameActions();
  const cooldowns = useCooldowns();
  const gauge = usePlayerGauge();

  // Handler for action buttons
  const handleAction = (action: ActionType) => {
    executeAction('player', action);
  };

  // Determine if actions are available
  const isPushReady = cooldowns.push === 0;
  const isTsuppariReady = cooldowns.tsuppari === 0;
  const isSpecialReady = cooldowns.special === 0 && gauge >= 100;

  return (
    <div
      className={`controls-overlay ${className}`}
      style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        width: '100%',
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: '16px 16px 32px 16px',
        pointerEvents: 'none', // Allow clicks to pass through container
        zIndex: 100,
        background: 'linear-gradient(to top, rgba(61, 40, 23, 0.8) 0%, rgba(61, 40, 23, 0) 100%)',
        transform: 'none', // Reset transform from CSS class
      }}
    >
      {/* Push Button */}
      <div style={{ pointerEvents: 'auto', flex: 1, maxWidth: '120px' }}>
        <ActionButton
          action="push"
          disabled={!isPushReady}
          cooldown={cooldowns.push}
          onClick={() => handleAction('push')}
          className="control-btn"
        />
      </div>

      {/* Tsuppari Button - slightly larger/prominent if needed, but keeping uniform for now */}
      <div style={{ pointerEvents: 'auto', flex: 1, maxWidth: '120px' }}>
        <ActionButton
          action="tsuppari"
          disabled={!isTsuppariReady}
          cooldown={cooldowns.tsuppari}
          onClick={() => handleAction('tsuppari')}
          className="control-btn"
        />
      </div>

      {/* Special Button */}
      <div style={{ pointerEvents: 'auto', flex: 1, maxWidth: '120px' }}>
        <ActionButton
          action="special"
          disabled={!isSpecialReady}
          cooldown={cooldowns.special}
          onClick={() => handleAction('special')}
          className="control-btn"
        />
      </div>
    </div>
  );
}
