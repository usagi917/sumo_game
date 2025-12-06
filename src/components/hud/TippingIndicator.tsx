/**
 * Tipping Indicator Component
 *
 * Displays wrestler's tipping ratio (0-100%) with color coding.
 * Based on TECHNICAL_DESIGN.md specification.
 */

import React from 'react';
import type { PhysicsState } from '../../types/game';
import './TippingIndicator.css';

interface TippingIndicatorProps {
  /** Physics state of the wrestler */
  actor: PhysicsState;
  /** Label for the indicator */
  label: string;
}

/**
 * TippingIndicator component
 * Shows tipping ratio (0-1) as percentage with color coding
 */
export const TippingIndicator: React.FC<TippingIndicatorProps> = ({
  actor,
  label,
}) => {
  // Convert tipping (0-1) to percentage (0-100)
  const tippingPercent = Math.round(actor.tipping * 100);

  // Determine color based on tipping level
  const getColor = (tipping: number): string => {
    if (tipping < 0.5) return '#4caf50'; // Green: Safe
    if (tipping < 0.8) return '#ff9800'; // Orange: Warning
    return '#f44336'; // Red: Danger
  };

  const color = getColor(actor.tipping);

  return (
    <div className="tipping-indicator">
      <div className="tipping-label">{label}</div>
      <div className="tipping-bar-container">
        <div
          className="tipping-bar-fill"
          style={{
            width: `${tippingPercent}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="tipping-value" style={{ color }}>
        {tippingPercent}%
      </div>
    </div>
  );
};
