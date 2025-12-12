/**
 * Result Screen Component
 *
 * Victory/defeat screen showing match results and ranking updates
 * Records win/loss to ranking system and displays rank changes
 * Option to replay or return to title
 */

import { useEffect } from 'react';
import { useGameActions, useWinner, usePlayer, useOpponent } from '../../state/gameStore';
import {
  useRankingStore,
  useCurrentRankName,
  useWinsUntilPromotion,
  useNextRankName,
  RANK_NAMES,
} from '../../state/rankingStore';

/**
 * Result Screen Props
 */
export interface ResultScreenProps {
  /** Optional className */
  className?: string;
}

/**
 * Result Screen Component
 * Shows match outcome, ranking updates, and replay option
 */
export default function ResultScreen({ className = '' }: ResultScreenProps) {
  const winner = useWinner();
  const player = usePlayer();
  const opponent = useOpponent();
  const { startNewGame, setGameStatus } = useGameActions();

  // Ranking state
  const { recordWin, recordLoss, lastAction } = useRankingStore();
  const currentRankName = useCurrentRankName();
  const winsUntilPromotion = useWinsUntilPromotion();
  const nextRankName = useNextRankName();
  const consecutiveWins = useRankingStore((state) => state.consecutiveWins);

  // Record win/loss on mount (only once)
  useEffect(() => {
    if (winner === 'player') {
      recordWin();
    } else {
      recordLoss();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only on mount

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
          marginBottom: 'var(--spacing-md)',
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

      {/* Ranking Update Panel */}
      <div
        className="retro-panel"
        style={{
          marginBottom: 'var(--spacing-xl)',
          padding: 'var(--spacing-lg)',
          minWidth: '300px',
          textAlign: 'center',
        }}
      >
        {/* Promotion */}
        {lastAction === 'promoted' && (
          <div>
            <p
              className="retro-text"
              style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'bold',
                color: 'var(--tapping-safe)',
                marginBottom: 'var(--spacing-sm)',
                textShadow: '2px 2px 0 var(--retro-dark)',
              }}
            >
              ★ 昇進！ ★
            </p>
            <p className="retro-text" style={{ fontSize: 'var(--font-md)', marginBottom: 'var(--spacing-xs)' }}>
              新番付: <strong style={{ color: 'var(--retro-accent)', fontSize: 'var(--font-lg)' }}>{currentRankName}</strong>
            </p>
            <p className="retro-text" style={{ fontSize: 'var(--font-sm)', opacity: 0.8 }}>
              3連勝達成！
            </p>
          </div>
        )}

        {/* Demotion */}
        {lastAction === 'demoted' && (
          <div>
            <p
              className="retro-text"
              style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'bold',
                color: 'var(--hp-red)',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              降格...
            </p>
            <p className="retro-text" style={{ fontSize: 'var(--font-md)', marginBottom: 'var(--spacing-xs)' }}>
              現番付: <strong>{currentRankName}</strong>
            </p>
            <p className="retro-text" style={{ fontSize: 'var(--font-sm)', opacity: 0.8 }}>
              次の昇進まであと3勝
            </p>
          </div>
        )}

        {/* Win (no rank change) */}
        {lastAction === 'win' && playerWon && (
          <div>
            <p className="retro-text" style={{ fontSize: 'var(--font-md)', marginBottom: 'var(--spacing-xs)' }}>
              番付: <strong style={{ color: 'var(--retro-accent)' }}>{currentRankName}</strong>
            </p>
            <p className="retro-text" style={{ fontSize: 'var(--font-sm)', color: 'var(--tapping-safe)' }}>
              連勝: {consecutiveWins} / 3
            </p>
            {nextRankName && (
              <p className="retro-text" style={{ fontSize: 'var(--font-xs)', opacity: 0.8 }}>
                あと{winsUntilPromotion}勝で{nextRankName}
              </p>
            )}
          </div>
        )}

        {/* Loss (no rank change - at 前頭 or 横綱) */}
        {lastAction === 'loss' && !playerWon && (
          <div>
            <p className="retro-text" style={{ fontSize: 'var(--font-md)', marginBottom: 'var(--spacing-xs)' }}>
              番付: <strong>{currentRankName}</strong>
            </p>
            <p className="retro-text" style={{ fontSize: 'var(--font-sm)', opacity: 0.8 }}>
              連勝記録リセット
            </p>
            {currentRankName === '前頭' && (
              <p className="retro-text" style={{ fontSize: 'var(--font-xs)', opacity: 0.8 }}>
                （前頭からは降格なし）
              </p>
            )}
            {currentRankName === '横綱' && (
              <p className="retro-text" style={{ fontSize: 'var(--font-xs)', opacity: 0.8 }}>
                （横綱は降格なし）
              </p>
            )}
          </div>
        )}
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
