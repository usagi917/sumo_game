/**
 * Ranking State Store
 *
 * Manages traditional sumo ranking progression system (番付システム).
 * Players start at 前頭 (Maegashira) and advance through ranks based on consecutive wins.
 *
 * Based on plan.md specification:
 * - 3 consecutive wins = promotion (except at 横綱)
 * - 1 loss = demotion (except at 前頭) + reset consecutive wins
 * - 横綱 (Yokozuna) maintains rank regardless of results
 * - Persists to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Sumo rank levels (0-4)
 * 0: 前頭 (Maegashira) - Lowest rank
 * 1: 小結 (Komusubi)
 * 2: 関脇 (Sekiwake)
 * 3: 大関 (Ozeki)
 * 4: 横綱 (Yokozuna) - Highest rank
 */
export type SumoRank = 0 | 1 | 2 | 3 | 4;

/**
 * Rank names in Japanese
 */
export const RANK_NAMES = ['前頭', '小結', '関脇', '大関', '横綱'] as const;

/**
 * Promotion requirement
 */
export const WINS_REQUIRED_FOR_PROMOTION = 3;

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

          // Check for promotion (3 consecutive wins + not at max rank)
          const canPromote =
            newConsecutiveWins >= WINS_REQUIRED_FOR_PROMOTION &&
            state.currentRank < 4;

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

          // 横綱 (rank 4) never demotes
          if (state.currentRank === 4) {
            return {
              ...state,
              consecutiveWins: 0, // Still reset streak
              totalLosses: newTotalLosses,
              lastAction: 'loss' as RankAction,
            };
          }

          // 前頭 (rank 0) cannot demote further
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
            // Just record loss at 前頭
            return {
              ...state,
              consecutiveWins: 0, // Reset streak even at 前頭
              totalLosses: newTotalLosses,
              lastAction: 'loss' as RankAction,
            };
          }
        }),

      /**
       * Reset ranking to initial state (for testing/debug)
       */
      resetRanking: () => set(initialState),
    }),
    {
      name: 'sumoRanking', // localStorage key
      version: 1,
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
  if (state.currentRank === 4) {
    return 0; // Already at max rank
  }
  return WINS_REQUIRED_FOR_PROMOTION - state.consecutiveWins;
};

/**
 * Get next rank name (if promotable)
 */
export const useNextRankName = () => {
  const rank = useRankingStore((state) => state.currentRank);
  if (rank === 4) {
    return null; // No next rank
  }
  return RANK_NAMES[rank + 1];
};

/**
 * Check if at maximum rank
 */
export const useIsYokozuna = () => {
  const rank = useRankingStore((state) => state.currentRank);
  return rank === 4;
};

/**
 * Get formatted career record (e.g., "10勝 3敗")
 */
export const useCareerRecord = () => {
  const { totalWins, totalLosses } = useRankingStore();
  return `${totalWins}勝 ${totalLosses}敗`;
};
