/**
 * Main Application Component
 *
 * Orchestrates screen switching based on game state:
 * - title: TitleScreen (start screen)
 * - battle: GameScreen (active gameplay)
 * - result: ResultScreen (victory/defeat)
 */

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import TitleScreen from './components/screens/TitleScreen';
import GameScreen from './components/screens/GameScreen';
import ResultScreen from './components/screens/ResultScreen';
import { useGameStatus } from './state/gameStore';
import { Web3Provider } from './providers/Web3Provider';
import { YokozunaNFTModal } from './components/nft/YokozunaNFTModal';
import { useNFTStore } from './state/nftStore';

/**
 * Game Content Component
 * Handles screen switching based on game status
 */
function GameContent() {
  const gameStatus = useGameStatus();
  const { showYokozunaModal, closeYokozunaModal } = useNFTStore();

  // Render appropriate screen based on game status
  const renderScreen = () => {
    switch (gameStatus) {
      case 'title':
        return <TitleScreen />;
      case 'battle':
        return <GameScreen />;
      case 'result':
        return <ResultScreen />;
      default:
        // Fallback to title screen if unknown status
        return <TitleScreen />;
    }
  };

  return (
    <>
      {renderScreen()}
      <YokozunaNFTModal
        isOpen={showYokozunaModal}
        onClose={closeYokozunaModal}
        onSkip={closeYokozunaModal}
      />
    </>
  );
}

/**
 * App Component
 * Main application orchestrator managing screen flow
 */
export default function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <Web3Provider>
      <GameContent />
    </Web3Provider>
  );
}
