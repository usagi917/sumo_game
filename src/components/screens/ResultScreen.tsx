/**
 * Result Screen Component
 *
 * Victory/defeat screen showing match results
 * Option to replay or return to title
 */

import { useGameActions, useWinner, usePlayer, useOpponent } from '../../state/gameStore';

/**
 * Result Screen Props
 */
export interface ResultScreenProps {
  /** Optional className */
  className?: string;
}

/**
 * Result Screen Component
 * Shows match outcome and replay option
 */
export default function ResultScreen({ className = '' }: ResultScreenProps) {
  const winner = useWinner();
  const player = usePlayer();
  const opponent = useOpponent();
  const { startNewGame, setGameStatus } = useGameActions();

  // Determine if player won
  const playerWon = winner === 'player';
  const resultText = playerWon ? 'あなたの勝ち!' : '負けました...';
  const resultColor = playerWon ? 'var(--hp-green)' : 'var(--hp-red)';

  // Determine win condition
  let winCondition = '';
  if (playerWon) {
    if (opponent.isFallen) {
      winCondition = '転倒勝ち!';
    } else {
      winCondition = '押し出し勝ち!';
    }
  } else {
    if (player.isFallen) {
      winCondition = '転倒で敗北';
    } else {
      winCondition = '押し出された!';
    }
  }

  const handleReplay = () => {
    startNewGame();
  };

  const handleReturnToTitle = () => {
    setGameStatus('title');
  };

  return (
    <div className={`full-screen center-content ${className}`}>
      {/* Result Message */}
      <h1
        className="retro-title"
        style={{
          color: resultColor,
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        {resultText}
      </h1>

      {/* Win Condition */}
      <p
        className="retro-subtitle"
        style={{
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        {winCondition}
      </p>

      {/* Stats Panel */}
      <div
        className="retro-panel"
        style={{
          marginBottom: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          minWidth: '300px',
        }}
      >
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-sm)' }}>
          <strong>最終結果:</strong>
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
          <span className="retro-text">あなたの傾き:</span>
          <span className="retro-text" style={{ color: player.isFallen ? 'var(--hp-red)' : 'var(--hp-green)' }}>
            {Math.round(player.tipping * 100)}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="retro-text">あいての傾き:</span>
          <span className="retro-text" style={{ color: opponent.isFallen ? 'var(--hp-red)' : 'var(--hp-green)' }}>
            {Math.round(opponent.tipping * 100)}%
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
        <button
          className="retro-button"
          onClick={handleReplay}
          style={{
            fontSize: 'var(--font-md)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
          }}
        >
          もう一度
        </button>

        <button
          className="retro-button"
          onClick={handleReturnToTitle}
          style={{
            fontSize: 'var(--font-md)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            backgroundColor: 'var(--retro-dark)',
          }}
        >
          タイトルへ
        </button>
      </div>
    </div>
  );
}
