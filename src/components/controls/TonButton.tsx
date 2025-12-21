/**
 * Ton Button Component
 *
 * Large "トン！" button for tonton sumo gameplay.
 * Players tap this button to make their wrestler move forward.
 */

import React, { useState, useCallback } from 'react';
import { useGameActions } from '../../state/gameStore';
import { playTapSound, resumeAudio } from '../../systems/sound';
import './TonButton.css';

/**
 * TonButton component
 * Single large button for tap-based gameplay with haptic feedback
 */
export const TonButton: React.FC = () => {
  const { executeTap } = useGameActions();
  const [isPressed, setIsPressed] = useState(false);

  const handleTap = useCallback(() => {
    resumeAudio();
    playTapSound();
    executeTap();

    // Visual feedback
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 80);

    // Haptic feedback (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, [executeTap]);

  return (
    <div className="ton-button-container">
      <button
        className={`ton-button ${isPressed ? 'ton-button--pressed' : ''}`}
        onClick={handleTap}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTap();
        }}
        type="button"
      >
        <span className="ton-button-text">トン！</span>
      </button>
    </div>
  );
};
