/**
 * Action Button Component
 *
 * Retro-styled button for game actions (push, tsuppari, special)
 * Shows cooldown state and disabled when unavailable
 */

import type { ActionType } from '../../types/game';

/**
 * Action Button Props
 */
export interface ActionButtonProps {
  /** Action type (determines label and styling) */
  action: ActionType;
  /** Whether button is disabled */
  disabled: boolean;
  /** Current cooldown in milliseconds (0 if ready) */
  cooldown: number;
  /** Click handler */
  onClick: () => void;
  /** Optional className */
  className?: string;
}

/**
 * Get Japanese label for action
 */
function getActionLabel(action: ActionType): string {
  switch (action) {
    case 'push':
      return '押し';
    case 'tsuppari':
      return '突っ張り';
    case 'special':
      return '必殺技';
  }
}

/**
 * Get button color for action
 * Uses retro color palette
 */
function getActionColor(action: ActionType): string {
  switch (action) {
    case 'push':
      return 'var(--retro-accent)'; // Medium green
    case 'tsuppari':
      return 'var(--retro-fg)'; // Bright green
    case 'special':
      return 'var(--retro-dark)'; // Dark green
  }
}

/**
 * Action Button Component
 * Retro 8-bit styled button with cooldown visualization
 */
export default function ActionButton({
  action,
  disabled,
  cooldown,
  onClick,
  className = '',
}: ActionButtonProps) {
  const label = getActionLabel(action);
  const color = getActionColor(action);

  // Calculate cooldown percentage for visual feedback
  const cooldownPercent = cooldown > 0 ? 1 - cooldown / 1000 : 1; // Assume max 1s cooldown for visual

  // Button style
  const buttonStyle: React.CSSProperties = {
    backgroundColor: disabled ? 'var(--retro-dark)' : color,
    position: 'relative',
    overflow: 'hidden',
    width: '100%', // Fill container
    height: '60px', // Fixed height for touch target
    borderRadius: '8px',
    border: '4px solid rgba(0,0,0,0.2)',
    color: '#111',
    fontSize: '14px',
    fontWeight: 'bold',
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0, // Override retro-button padding to fit text
    boxShadow: '0 4px 0 rgba(0,0,0,0.3)',
    transform: 'translateY(0)',
    transition: 'all 0.1s',
  };

  return (
    <button
      type="button"
      className={`retro-button ${className}`}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label}ボタン${disabled ? '（使用不可）' : ''}`}
    >
      {/* Cooldown overlay */}
      {cooldown > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: `${(1 - cooldownPercent) * 100}%`, // Vertical fill
            width: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            transition: 'height 0.1s linear',
          }}
        />
      )}

      {/* Button label */}
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
    </button>
  );
}
