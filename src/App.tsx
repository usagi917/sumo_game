/**
 * Main Application Component
 *
 * Orchestrates screen switching based on game state:
 * - title: TitleScreen (start screen)
 * - battle: GameScreen (active gameplay)
 * - result: ResultScreen (victory/defeat)
 */

import TitleScreen from './components/screens/TitleScreen';
import GameScreen from './components/screens/GameScreen';
import ResultScreen from './components/screens/ResultScreen';
import { useGameStatus } from './state/gameStore';

/**
 * App Component
 * Main application orchestrator managing screen flow
 */
export default function App() {
  const gameStatus = useGameStatus();

  // Render appropriate screen based on game status
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
}
