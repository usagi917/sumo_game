/**
 * Ton Button Component
 *
 * Large "トン！" button for tonton sumo gameplay.
 * Players tap this button to make their wrestler move forward.
 *
 * Based on TECHNICAL_DESIGN.md specification.
 */

import React from 'react';
import { useGameActions } from '../../state/gameStore';
import './TonButton.css';

/**
 * TonButton component
 * Single large button for tap-based gameplay
 */
export const TonButton: React.FC = () => {
  const { executeTap } = useGameActions();

  const handleTap = () => {
    executeTap();
  };

  return (
    <div className="ton-button-container">
      <button className="ton-button" onClick={handleTap} type="button">
        <span className="ton-button-text">トン！</span>
      </button>
    </div>
  );
};
