/**
 * Result Screen Component
 *
 * Victory/defeat screen showing match results and ranking updates.
 * Records win/loss to ranking system and displays rank changes.
 */

import { useEffect, useRef } from 'react';
import { useGameActions, useWinner } from '../../state/gameStore';
import {
  useRankingStore,
  useCurrentRankName,
  useWinsUntilPromotion,
  useNextRankName,
  WINS_REQUIRED,
} from '../../state/rankingStore';
import { useNFTStore } from '../../state/nftStore';
import { playVictorySound, playDefeatSound } from '../../systems/sound';

export interface ResultScreenProps {
  className?: string;
}

export default function ResultScreen({ className = '' }: ResultScreenProps) {
  const winner = useWinner();
  const { startNewGame, setGameStatus, resetGame } = useGameActions();

  // Ranking state
  const { recordWin, recordLoss, lastAction, currentRank, resetRanking } = useRankingStore();
  const currentRankName = useCurrentRankName();
  const winsUntilPromotion = useWinsUntilPromotion();
  const nextRankName = useNextRankName();
  const consecutiveWins = useRankingStore((state) => state.consecutiveWins);
  const winsNeeded = WINS_REQUIRED[currentRank];

  // NFT state
  const triggerYokozunaModal = useNFTStore((state) => state.triggerYokozunaModal);

  // Record win/loss and play sound on mount (only once)
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    if (winner === 'player') {
      recordWin();
      playVictorySound();
    } else {
      recordLoss();
      playDefeatSound();
    }
  }, [winner, recordWin, recordLoss]);

  // 横綱昇進時にNFTモーダルを表示
  useEffect(() => {
    if (lastAction === 'promoted' && currentRank === 5) {
      // 少し遅延させて昇進メッセージを見せてからモーダル表示
      const timer = setTimeout(() => {
        triggerYokozunaModal();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [lastAction, currentRank, triggerYokozunaModal]);

  const playerWon = winner === 'player';
  const resultText = playerWon ? '勝ち!' : '負け...';
  const resultColor = playerWon ? '#4caf50' : '#f44336';

  const handleReplay = () => {
    startNewGame();
  };

  const handleReturnToTitle = () => {
    setGameStatus('title');
  };

  const handleRestartFromBeginning = () => {
    const confirmed = window.confirm('番付と戦績をリセットして最初からやり直しますか？');
    if (!confirmed) return;
    resetRanking();
    resetGame();
  };

  return (
    <div className={`full-screen scrollable center-content ${className}`}>
      {/* Result Message */}
      <h1
        className="retro-title"
        style={{
          color: resultColor,
          marginBottom: '16px',
          fontSize: '48px',
        }}
      >
        {resultText}
      </h1>

      {/* Ranking Update Panel */}
      <div
        className="retro-panel"
        style={{
          padding: '24px',
          textAlign: 'center',
          minWidth: '280px',
          marginBottom: '24px',
        }}
      >
        {/* Promotion */}
        {lastAction === 'promoted' && (
          <div>
            <p
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#ffd700',
                marginBottom: '12px',
                textShadow: '2px 2px 0 #000',
              }}
            >
              ★ 昇進！ ★
            </p>
            <p style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>
              新番付
            </p>
            <p
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffd700',
                textShadow: '2px 2px 0 #000',
              }}
            >
              {currentRankName}
            </p>
          </div>
        )}

        {/* Demotion */}
        {lastAction === 'demoted' && (
          <div>
            <p
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#f44336',
                marginBottom: '12px',
              }}
            >
              降格...
            </p>
            <p style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>
              現番付
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
              {currentRankName}
            </p>
          </div>
        )}

        {/* Win (no rank change) */}
        {lastAction === 'win' && (
          <div>
            <p style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>
              番付
            </p>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#ffd700',
                marginBottom: '16px',
              }}
            >
              {currentRankName}
            </p>
            {winsNeeded > 1 && (
              <p style={{ fontSize: '16px', color: '#4caf50' }}>
                昇進まで {consecutiveWins}/{winsNeeded}勝
              </p>
            )}
            {winsNeeded === 1 && nextRankName && (
              <p style={{ fontSize: '16px', color: '#4caf50' }}>
                あと1勝で{nextRankName}
              </p>
            )}
          </div>
        )}

        {/* Loss (no rank change - at 十両) */}
        {lastAction === 'loss' && (
          <div>
            <p style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>
              番付
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
              {currentRankName}
            </p>
            <p style={{ fontSize: '14px', color: '#aaa', marginTop: '12px' }}>
              （十両からは降格なし）
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="retro-button"
          onClick={handleRestartFromBeginning}
          style={{
            fontSize: '18px',
            padding: '16px 32px',
            backgroundColor: '#ff9800',
          }}
        >
          最初から
        </button>

        <button
          className="retro-button"
          onClick={handleReplay}
          style={{
            fontSize: '18px',
            padding: '16px 32px',
            backgroundColor: '#4caf50',
          }}
        >
          次の取り組みへ
        </button>

        <button
          className="retro-button"
          onClick={handleReturnToTitle}
          style={{
            fontSize: '18px',
            padding: '16px 32px',
            backgroundColor: '#666',
          }}
        >
          タイトルへ
        </button>
      </div>
    </div>
  );
}
