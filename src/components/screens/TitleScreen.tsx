/**
 * Title Screen Component
 *
 * Game start screen with title and start button
 * Retro 8-bit styling
 */

import { useGameActions } from '../../state/gameStore';

/**
 * Title Screen Props
 */
export interface TitleScreenProps {
  /** Optional className */
  className?: string;
}

/**
 * Title Screen Component
 * Simple title + start button screen
 */
export default function TitleScreen({ className = '' }: TitleScreenProps) {
  const { startNewGame } = useGameActions();

  const handleStart = () => {
    startNewGame();
  };

  return (
    <div className={`full-screen center-content ${className}`}>
      {/* Game Title */}
      <h1 className="retro-title" style={{ marginBottom: 'var(--spacing-xl)' }}>
        レトロ相撲
      </h1>

      {/* Subtitle */}
      <p className="retro-subtitle" style={{ marginBottom: 'var(--spacing-xl)' }}>
        8bit バトル
      </p>

      {/* Start Button */}
      <button
        className="retro-button"
        onClick={handleStart}
        style={{
          fontSize: 'var(--font-lg)',
          padding: 'var(--spacing-lg) var(--spacing-xl)',
        }}
      >
        スタート
      </button>

      {/* Instructions */}
      <div
        className="retro-panel"
        style={{
          marginTop: 'var(--spacing-xl)',
          maxWidth: '500px',
          padding: 'var(--spacing-md)',
        }}
      >
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-sm)' }}>
          <strong>遊び方:</strong>
        </p>
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          • 押し: 強い一撃 (10ダメージ)
        </p>
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          • 突っ張り: 速い連打 (3ダメージ)
        </p>
        <p className="retro-text">• 必殺技: 最強の技 (30ダメージ、ゲージ満タンで使用可能)</p>
      </div>
    </div>
  );
}
