/**
 * Gauge Bar Component
 *
 * Displays special move gauge (0-100)
 * Lights up when full (can use special)
 * Retro 8-bit styling
 */

/**
 * Gauge Bar Props
 */
export interface GaugeBarProps {
  /** Current gauge value (0-100) */
  gauge: number;
  /** Optional className for positioning */
  className?: string;
}

/**
 * Gauge Bar Component
 * Shows special move gauge with visual feedback when full
 */
export default function GaugeBar({ gauge, className = '' }: GaugeBarProps) {
  // Calculate gauge percentage (clamped 0-1)
  const gaugePercent = Math.max(0, Math.min(1, gauge / 100));

  // Gauge is "ready" when at 100
  const isReady = gauge >= 100;

  // Color changes when ready
  const gaugeColor = isReady ? 'var(--gauge-blue)' : 'var(--retro-dark)';

  // Pulse animation when ready
  const containerStyle: React.CSSProperties = {
    minWidth: '250px',
    ...(isReady && {
      animation: 'pulse 0.8s ease-in-out infinite',
    }),
  };

  return (
    <>
      {/* Add keyframe animation for pulse */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: var(--border-width) var(--border-width) 0 var(--retro-dark);
            }
            50% {
              transform: scale(1.05);
              box-shadow: var(--border-width) var(--border-width) 0 var(--gauge-blue),
                          0 0 8px var(--gauge-blue);
            }
          }
        `}
      </style>

      <div className={`retro-panel ${className}`} style={containerStyle}>
        {/* Label */}
        <div
          className="retro-text"
          style={{
            marginBottom: 'var(--spacing-xs)',
            fontWeight: 'bold',
            fontSize: 'var(--font-sm)',
          }}
        >
          {isReady ? '必殺技 READY!' : '必殺技ゲージ'}
        </div>

        {/* Gauge Bar Container */}
        <div className="retro-bar-container">
          {/* Gauge Bar Fill */}
          <div
            className="retro-bar-fill"
            style={{
              width: `${gaugePercent * 100}%`,
              backgroundColor: gaugeColor,
            }}
          />

          {/* Gauge Text Overlay */}
          <div className="retro-bar-label">{Math.ceil(gauge)}%</div>
        </div>
      </div>
    </>
  );
}
