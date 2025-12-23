/**
 * NFT State Store
 *
 * 横綱NFT取得のモーダル表示・取得状態を管理
 * - 横綱昇進時に1回だけNFT取得可能
 * - ランキングリセット時にリセットされる
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NFTState {
  // 横綱昇進NFTモーダルを表示するか
  showYokozunaModal: boolean;
  // 今回の横綱昇進でNFTを取得済み（または取得をスキップ済み）か
  hasClaimedYokozunaNFT: boolean;
}

interface NFTActions {
  // 横綱昇進時にモーダルを表示（未取得の場合のみ）
  triggerYokozunaModal: () => void;
  // モーダルを閉じる
  closeYokozunaModal: () => void;
  // NFT取得完了をマーク
  markNFTClaimed: () => void;
  // リセット（ランキングリセット時に呼ぶ）
  resetNFTState: () => void;
}

type NFTStore = NFTState & NFTActions;

export const useNFTStore = create<NFTStore>()(
  persist(
    (set, get) => ({
      showYokozunaModal: false,
      hasClaimedYokozunaNFT: false,

      triggerYokozunaModal: () => {
        // 既に取得済みならモーダルを表示しない
        if (get().hasClaimedYokozunaNFT) return;
        set({ showYokozunaModal: true });
      },

      closeYokozunaModal: () => set({ showYokozunaModal: false }),

      markNFTClaimed: () => set({ hasClaimedYokozunaNFT: true }),

      resetNFTState: () => set({ hasClaimedYokozunaNFT: false, showYokozunaModal: false }),
    }),
    {
      name: "sumoNFT", // localStorage key
      version: 1,
    }
  )
);
