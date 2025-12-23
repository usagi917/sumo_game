import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// WalletConnect Project ID
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

// 使用するチェーン（現在はBase Sepolia固定）
const targetChain = baseSepolia;

export const config = createConfig(
  getDefaultConfig({
    chains: [baseSepolia, base],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
    walletConnectProjectId,
    appName: "相撲バトルゲーム",
    appDescription: "横綱に昇進してNFTを獲得しよう！",
  })
);

// コントラクトアドレス
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined;

// 使用するチェーンID
export const CHAIN_ID = targetChain.id;
