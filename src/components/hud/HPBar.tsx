/**
 * HP Bar Component
 *
 * Displays actor's HP with color-coded bar (green/yellow/red)
 * Retro 8-bit styling
 */

/**
 * HP Bar Props
 */
export interface HPBarProps {
  /** Current HP (0-100) */
  hp: number;
  /** Maximum HP (typically 100) */
  maxHp: number;
  /** Label for the bar (e.g., "PLAYER" or "OPPONENT") */
  label: string;
  /** Optional className for positioning */
  className?: string;
}

/**
 * Get HP bar color based on current HP percentage
 * @param hpPercent - HP percentage (0-1)
 * @returns CSS color variable
 */
function getHPColor(hpPercent: number): string {
  if (hpPercent > 0.7) {
    return 'var(--hp-green)';
  } else if (hpPercent > 0.3) {
    return 'var(--hp-yellow)';
  } else {
    return 'var(--hp-red)';
  }
}

/**
 * HP Bar Component
 * Retro-styled health bar with color coding
 */
export default function HPBar({ hp, maxHp, label, className = '' }: HPBarProps) {
  // Calculate HP percentage (clamped 0-1)
  const hpPercent = Math.max(0, Math.min(1, hp / maxHp));
  const hpColor = getHPColor(hpPercent);

  // Display HP as integers
  const displayHP = Math.ceil(hp);
  const displayMaxHP = Math.ceil(maxHp);

  return (
    <div className={`retro-panel ${className}`} style={{ flex: 1, minWidth: '140px' }}>
      {/* Label */}
      <div
        className="retro-text"
        style={{
          marginBottom: 'var(--spacing-xs)',
          fontWeight: 'bold',
          fontSize: 'var(--font-sm)',
        }}
      >
        {label}
      </div>

      {/* HP Bar Container */}
      <div className="retro-bar-container">
        {/* HP Bar Fill */}
        <div
          className="retro-bar-fill"
          style={{
            width: `${hpPercent * 100}%`,
            backgroundColor: hpColor,
          }}
        />

        {/* HP Text Overlay */}
        <div className="retro-bar-label">
          HP {displayHP}/{displayMaxHP}
        </div>
      </div>
    </div>
  );
}
