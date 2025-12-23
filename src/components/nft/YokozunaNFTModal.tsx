import { useEffect, useRef, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useYokozunaNFT } from "../../hooks/useYokozunaNFT";
import { CHAIN_ID } from "../../config/wagmi";

interface YokozunaNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

type ModalState = "prompt" | "minting" | "success" | "error";

export function YokozunaNFTModal({ isOpen, onClose, onSkip }: YokozunaNFTModalProps) {
  const { isConnected, chainId: walletChainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const nftImageUrl = "/sumoNFT.png";
  const {
    nextGeneration,
    mint,
    isWritePending,
    isConfirming,
    isConfirmed,
    isReceiptError,
    receiptError,
    receiptStatus,
    writeError,
    mintedGeneration,
    isContractReady,
    transactionHash,
    reset,
  } = useYokozunaNFT();

  const [modalState, setModalState] = useState<ModalState>("prompt");
  const [expectedGeneration, setExpectedGeneration] = useState<number | null>(null);
  const autoSwitchAttempted = useRef(false);

  const isCorrectChain = walletChainId === CHAIN_ID;

  // モーダル表示時に自動でBase Sepoliaへ切替
  useEffect(() => {
    if (!isOpen) {
      autoSwitchAttempted.current = false;
      return;
    }
    if (!isConnected || isCorrectChain || autoSwitchAttempted.current || !switchChain) {
      return;
    }
    autoSwitchAttempted.current = true;
    switchChain({ chainId: CHAIN_ID });
  }, [isOpen, isConnected, isCorrectChain, switchChain]);

  // ミント成功時
  useEffect(() => {
    if (isConfirmed) {
      setModalState("success");
    }
  }, [isConfirmed]);

  // エラー時
  useEffect(() => {
    if (writeError || isReceiptError || receiptStatus === "reverted") {
      setModalState("error");
    }
  }, [writeError, isReceiptError, receiptStatus]);

  // ミント中の状態更新
  useEffect(() => {
    if (isConfirmed) return;
    if (isWritePending || isConfirming) {
      setModalState("minting");
    }
  }, [isWritePending, isConfirming, isConfirmed]);

  // モーダルを閉じる時のリセット
  const handleClose = () => {
    reset();
    setModalState("prompt");
    setExpectedGeneration(null);
    onClose();
  };

  const handleSkip = () => {
    reset();
    setModalState("prompt");
    setExpectedGeneration(null);
    onSkip();
  };

  const handleMint = () => {
    if (!isCorrectChain) {
      switchChain({ chainId: CHAIN_ID });
      return;
    }
    setExpectedGeneration(nextGeneration ?? null);
    mint();
  };

  const handleRetry = () => {
    reset();
    setModalState("prompt");
    setExpectedGeneration(null);
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div className="retro-panel" style={styles.modal}>
        {/* プロンプト状態 */}
        {modalState === "prompt" && (
          <>
            <h2 className="retro-title" style={styles.title}>
              🏆 横綱昇進！
            </h2>
            <p className="retro-text" style={styles.text}>
              おめでとうございます！
              <br />
              横綱NFTを取得しますか？
            </p>
            <img src={nftImageUrl} alt="横綱NFT" style={styles.nftImage} />
            {nextGeneration && (
              <p className="retro-subtitle" style={styles.generation}>
                第{nextGeneration}代横綱
              </p>
            )}

            {!isContractReady ? (
              <p className="retro-text" style={styles.errorText}>
                コントラクトが設定されていません
              </p>
            ) : !isConnected ? (
              <div style={styles.connectWrapper}>
                <ConnectKitButton />
              </div>
            ) : !isCorrectChain ? (
              <button
                className="retro-button"
                onClick={() => switchChain({ chainId: CHAIN_ID })}
                style={styles.button}
              >
                Base Sepoliaに切替
              </button>
            ) : (
              <button
                className="retro-button"
                onClick={handleMint}
                style={styles.button}
              >
                NFTを取得する
              </button>
            )}

            <button
              className="retro-button"
              onClick={handleSkip}
              style={styles.skipButton}
            >
              スキップ
            </button>
          </>
        )}

        {/* ミント中 */}
        {modalState === "minting" && (
          <>
            <h2 className="retro-title" style={styles.title}>
              ⏳ ミント中...
            </h2>
            <p className="retro-text" style={styles.text}>
              {isWritePending && "トランザクションを承認してください..."}
              {isConfirming && "トランザクション確認中..."}
            </p>
            <div style={styles.spinner} />
            {transactionHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                target="_blank"
                rel="noreferrer"
                style={styles.explorerLink}
              >
                Basescanで確認
              </a>
            )}
          </>
        )}

        {/* 成功 */}
        {modalState === "success" && (
          <>
            <h2 className="retro-title" style={styles.title}>
              🎉 取得成功！
            </h2>
            {(mintedGeneration || expectedGeneration) && (
              <p className="retro-subtitle" style={styles.generation}>
                第{(mintedGeneration ?? BigInt(expectedGeneration!)).toString()}代横綱
              </p>
            )}
            <img src={nftImageUrl} alt="横綱NFT" style={styles.nftImage} />
            <p className="retro-text" style={styles.text}>
              横綱NFTを取得しました！
            </p>
            {isConfirmed && !mintedGeneration && expectedGeneration === null && (
              <p className="retro-text" style={styles.warningText}>
                取引は完了しましたが、イベントを取得できませんでした。
                チェーン/コントラクト設定を確認してください。
              </p>
            )}
            <button
              className="retro-button"
              onClick={handleClose}
              style={styles.button}
            >
              閉じる
            </button>
          </>
        )}

        {/* エラー */}
        {modalState === "error" && (
          <>
            <h2 className="retro-title" style={styles.title}>
              ❌ エラー
            </h2>
            <p className="retro-text" style={styles.errorText}>
              {writeError?.message ||
                receiptError?.message ||
                (receiptStatus === "reverted" ? "トランザクションが失敗しました" : "ミントに失敗しました")}
            </p>
            <button
              className="retro-button"
              onClick={handleRetry}
              style={styles.button}
            >
              再試行
            </button>
            <button
              className="retro-button"
              onClick={handleSkip}
              style={styles.skipButton}
            >
              スキップ
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    minWidth: "280px",
    maxWidth: "90vw",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-md)",
  },
  title: {
    fontSize: "var(--font-lg)",
    marginBottom: "var(--spacing-sm)",
  },
  text: {
    marginBottom: "var(--spacing-sm)",
  },
  generation: {
    fontSize: "var(--font-md)",
    color: "var(--retro-fg)",
  },
  nftImage: {
    width: "min(260px, 70vw)",
    height: "auto",
    border: "2px solid var(--retro-fg)",
    backgroundColor: "#fff",
    imageRendering: "auto",
    alignSelf: "center",
  },
  button: {
    width: "100%",
  },
  skipButton: {
    width: "100%",
    backgroundColor: "transparent",
    color: "var(--retro-fg)",
    border: "2px solid var(--retro-fg)",
  },
  connectWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "var(--spacing-sm)",
  },
  errorText: {
    color: "var(--hp-red)",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid var(--retro-fg)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },
  explorerLink: {
    color: "var(--retro-fg)",
    fontSize: "var(--font-xs)",
    textDecoration: "underline",
  },
  warningText: {
    color: "var(--tipping-warning)",
    fontSize: "var(--font-xs)",
  },
};

// スピナーアニメーション用のスタイルを追加
const spinnerStyle = document.createElement("style");
spinnerStyle.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);
