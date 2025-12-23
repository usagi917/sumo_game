/**
 * Ranking State Store
 *
 * Manages traditional sumo ranking progression system (番付システム).
 * Players start at 十両 and advance through ranks.
 *
 * Promotion rules:
 * - 十両→幕内→小結→関脇: 1勝で昇進
 * - 関脇→大関: 2連勝で昇進
 * - 大関→横綱: 3連勝で昇進
 * - 負けると1ランク降格（十両より下には落ちない）
 * - Persists to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNFTStore } from './nftStore';

/**
 * Sumo rank levels (0-5)
 * 0: 十両 (Juryo) - Starting rank
 * 1: 幕内 (Makuuchi)
 * 2: 小結 (Komusubi)
 * 3: 関脇 (Sekiwake)
 * 4: 大関 (Ozeki)
 * 5: 横綱 (Yokozuna) - Highest rank
 */
export type SumoRank = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Rank names in Japanese
 */
export const RANK_NAMES = ['十両', '幕内', '小結', '関脇', '大関', '横綱'] as const;

/**
 * Promotion requirements per rank
 * Key: current rank, Value: consecutive wins needed
 */
export const WINS_REQUIRED: Record<SumoRank, number> = {
  0: 1, // 十両→幕内: 1勝
  1: 1, // 幕内→小結: 1勝
  2: 1, // 小結→関脇: 1勝
  3: 2, // 関脇→大関: 2連勝
  4: 3, // 大関→横綱: 3連勝
  5: 0, // 横綱: 昇進なし
};

/**
 * Result of last ranking action
 */
export type RankAction = 'promoted' | 'demoted' | 'win' | 'loss' | null;

/**
 * Ranking state interface
 */
export interface RankingState {
  currentRank: SumoRank;
  consecutiveWins: number;
  totalWins: number;
  totalLosses: number;
  lastAction: RankAction;
}

/**
 * Ranking actions interface
 */
interface RankingActions {
  recordWin: () => void;
  recordLoss: () => void;
  resetRanking: () => void;
}

/**
 * Complete store type
 */
type RankingStore = RankingState & RankingActions;

/**
 * Initial state
 */
const initialState: RankingState = {
  currentRank: 0, // Start at 前頭
  consecutiveWins: 0,
  totalWins: 0,
  totalLosses: 0,
  lastAction: null,
};

/**
 * Ranking store with persistence
 */
export const useRankingStore = create<RankingStore>()(
  persist(
    (set) => ({
      ...initialState,

      /**
       * Record a win and check for promotion
       */
      recordWin: () =>
        set((state) => {
          const newConsecutiveWins = state.consecutiveWins + 1;
          const newTotalWins = state.totalWins + 1;

          // Check for promotion based on current rank requirements
          const winsNeeded = WINS_REQUIRED[state.currentRank];
          const canPromote =
            newConsecutiveWins >= winsNeeded && state.currentRank < 5;

          if (canPromote) {
            // Promote and reset consecutive wins
            return {
              ...state,
              currentRank: (state.currentRank + 1) as SumoRank,
              consecutiveWins: 0,
              totalWins: newTotalWins,
              lastAction: 'promoted' as RankAction,
            };
          } else {
            // Just record win
            return {
              ...state,
              consecutiveWins: newConsecutiveWins,
              totalWins: newTotalWins,
              lastAction: 'win' as RankAction,
            };
          }
        }),

      /**
       * Record a loss and check for demotion
       */
      recordLoss: () =>
        set((state) => {
          const newTotalLosses = state.totalLosses + 1;

          // 十両 (rank 0) cannot demote further
          const canDemote = state.currentRank > 0;

          if (canDemote) {
            // Demote and reset consecutive wins
            return {
              ...state,
              currentRank: (state.currentRank - 1) as SumoRank,
              consecutiveWins: 0,
              totalLosses: newTotalLosses,
              lastAction: 'demoted' as RankAction,
            };
          } else {
            // Just record loss at 十両
            return {
              ...state,
              consecutiveWins: 0,
              totalLosses: newTotalLosses,
              lastAction: 'loss' as RankAction,
            };
          }
        }),

      /**
       * Reset ranking to initial state (for testing/debug)
       * NFT取得状態もリセットする
       */
      resetRanking: () => {
        useNFTStore.getState().resetNFTState();
        set(initialState);
      },
    }),
    {
      name: 'sumoRanking', // localStorage key
      version: 2, // Increment version for new rank system
    }
  )
);

/**
 * Selector hooks and helper functions
 */

/**
 * Get current rank name in Japanese
 */
export const useCurrentRankName = () => {
  const rank = useRankingStore((state) => state.currentRank);
  return RANK_NAMES[rank];
};

/**
 * Get wins needed until promotion
 */
export const useWinsUntilPromotion = () => {
  const state = useRankingStore();
  if (state.currentRank === 5) {
    return 0; // Already at max rank
  }
  return WINS_REQUIRED[state.currentRank] - state.consecutiveWins;
};

/**
 * Get next rank name (if promotable)
 */
export const useNextRankName = () => {
  const rank = useRankingStore((state) => state.currentRank);
  if (rank === 5) {
    return null; // No next rank
  }
  return RANK_NAMES[rank + 1];
};

/**
 * Check if at maximum rank
 */
export const useIsYokozuna = () => {
  const rank = useRankingStore((state) => state.currentRank);
  return rank === 5;
};

/**
 * Get formatted career record (e.g., "10勝 3敗")
 */
export const useCareerRecord = () => {
  const { totalWins, totalLosses } = useRankingStore();
  return `${totalWins}勝 ${totalLosses}敗`;
};
