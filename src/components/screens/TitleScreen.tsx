/**
 * Title Screen Component
 *
 * Game start screen with title, ranking display, and start button
 * Retro 8-bit styling
 */

import { useGameActions } from '../../state/gameStore';
import {
  useRankingStore,
  useCurrentRankName,
  useCareerRecord,
  useWinsUntilPromotion,
  useNextRankName,
  useIsYokozuna,
} from '../../state/rankingStore';

/**
 * Title Screen Props
 */
export interface TitleScreenProps {
  /** Optional className */
  className?: string;
}

/**
 * Title Screen Component
 * Title + ranking display + start button
 */
export default function TitleScreen({ className = '' }: TitleScreenProps) {
  const { startNewGame } = useGameActions();
  const currentRankName = useCurrentRankName();
  const careerRecord = useCareerRecord();
  const winsUntilPromotion = useWinsUntilPromotion();
  const nextRankName = useNextRankName();
  const isYokozuna = useIsYokozuna();
  const consecutiveWins = useRankingStore((state) => state.consecutiveWins);

  const handleStart = () => {
    startNewGame();
  };

  return (
    <div className={`full-screen center-content ${className}`}>
      {/* Game Title */}
      <h1 className="retro-title" style={{ marginBottom: 'var(--spacing-md)' }}>
        レトロ相撲
      </h1>

      {/* Subtitle */}
      <p className="retro-subtitle" style={{ marginBottom: 'var(--spacing-lg)' }}>
        8bit バトル
      </p>

      {/* Ranking Display */}
      <div
        className="retro-panel"
        style={{
          marginBottom: 'var(--spacing-xl)',
          padding: 'var(--spacing-md)',
          minWidth: '300px',
          textAlign: 'center',
        }}
      >
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-sm)' }}>
          現在の番付
        </p>
        <div
          style={{
            fontSize: 'calc(var(--font-xl) * 2)',
            fontWeight: 'bold',
            color: 'var(--retro-accent)',
            marginBottom: 'var(--spacing-sm)',
            textShadow: '2px 2px 0 var(--retro-dark)',
          }}
        >
          {currentRankName}
        </div>
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-sm)' }}>
          戦績: {careerRecord}
        </p>
        {!isYokozuna && (
          <p className="retro-text" style={{ fontSize: 'var(--font-xs)', color: 'var(--retro-fg)', opacity: 0.8 }}>
            連勝: {consecutiveWins} / 3 (あと{winsUntilPromotion}勝で{nextRankName})
          </p>
        )}
        {isYokozuna && (
          <p
            className="retro-text"
            style={{ fontSize: 'var(--font-sm)', color: 'var(--tapping-safe)', fontWeight: 'bold' }}
          >
            ★ 最高位 ★
          </p>
        )}
      </div>

      {/* Start Button */}
      <button
        className="retro-button"
        onClick={handleStart}
        style={{
          fontSize: 'var(--font-lg)',
          padding: 'var(--spacing-lg) var(--spacing-xl)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        スタート
      </button>

      {/* Instructions */}
      <div
        className="retro-panel"
        style={{
          maxWidth: '500px',
          padding: 'var(--spacing-md)',
        }}
      >
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-sm)' }}>
          <strong>遊び方:</strong>
        </p>
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          • トン！ボタンを連打して相手を押し出せ！
        </p>
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-xs)' }}>
          • 相手を転倒させるか土俵外に出せば勝利
        </p>
        <p className="retro-text" style={{ marginBottom: 'var(--spacing-sm)' }}>
          • 連打すればするほど強い力で押せる
        </p>
        <p className="retro-text" style={{ fontSize: 'var(--font-xs)', opacity: 0.8 }}>
          ※ 3連勝で昇進、1敗で降格（前頭は降格なし、横綱は降格なし）
        </p>
      </div>
    </div>
  );
}
