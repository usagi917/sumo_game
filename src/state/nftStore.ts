/**
 * NFT State Store
 *
 * 横綱NFT取得のモーダル表示を管理
 */

import { create } from "zustand";

interface NFTState {
  // 横綱昇進NFTモーダルを表示するか
  showYokozunaModal: boolean;
}

interface NFTActions {
  // 横綱昇進時にモーダルを表示
  triggerYokozunaModal: () => void;
  // モーダルを閉じる
  closeYokozunaModal: () => void;
}

type NFTStore = NFTState & NFTActions;

export const useNFTStore = create<NFTStore>((set) => ({
  showYokozunaModal: false,

  triggerYokozunaModal: () => set({ showYokozunaModal: true }),

  closeYokozunaModal: () => set({ showYokozunaModal: false }),
}));
