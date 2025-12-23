import { useEffect } from "react";
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, CHAIN_ID } from "../config/wagmi";
import { YOKOZUNA_NFT_ABI } from "../config/contracts";
import { parseEventLogs } from "viem";

/**
 * 横綱NFTミント用カスタムフック
 */
export function useYokozunaNFT() {
  // 次の世代番号を取得
  const { data: nextGeneration, refetch: refetchNextGeneration } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YOKOZUNA_NFT_ABI,
    functionName: "nextGeneration",
    chainId: CHAIN_ID,
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  // 総発行数を取得
  const { data: totalMinted, refetch: refetchTotalMinted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: YOKOZUNA_NFT_ABI,
    functionName: "totalMinted",
    chainId: CHAIN_ID,
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  // ミントトランザクション
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // トランザクション確認待ち
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
    chainId: CHAIN_ID,
  });

  // ミント実行
  const mint = () => {
    if (!CONTRACT_ADDRESS) {
      console.error("Contract address not configured");
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: YOKOZUNA_NFT_ABI,
      functionName: "mint",
      chainId: CHAIN_ID,
    });
  };

  // ミント成功時に世代番号を取得
  const getMintedGeneration = (): bigint | null => {
    if (!receipt?.logs?.length) return null;

    try {
      const events = parseEventLogs({
        abi: YOKOZUNA_NFT_ABI,
        logs: receipt.logs,
        eventName: "YokozunaMinted",
        strict: false,
      });
      const event = events[0];
      const generation = event?.args?.generation as bigint | undefined;
      return generation ?? null;
    } catch {
      return null;
    }
  };

  // リセット（モーダルを閉じる時など）
  const reset = () => {
    resetWrite();
    refetchNextGeneration();
    refetchTotalMinted();
  };

  useEffect(() => {
    if (!isConfirmed) return;
    refetchNextGeneration();
    refetchTotalMinted();
  }, [isConfirmed, refetchNextGeneration, refetchTotalMinted]);

  const mintedGeneration =
    getMintedGeneration() ??
    (isConfirmed && totalMinted ? BigInt(totalMinted) : null);

  return {
    // 状態
    nextGeneration: nextGeneration ? Number(nextGeneration) : undefined,
    totalMinted: totalMinted ? Number(totalMinted) : undefined,
    isContractReady: !!CONTRACT_ADDRESS,

    // ミント関連
    mint,
    isWritePending,
    isConfirming,
    isConfirmed,
    isReceiptError,
    receiptError,
    receiptStatus: receipt?.status,
    writeError,
    transactionHash: hash,
    mintedGeneration,

    // アクション
    reset,
  };
}
