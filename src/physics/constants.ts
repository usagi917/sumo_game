/**
 * Physics Constants
 *
 * Custom physics engine constants for tonton sumo simulation.
 * Based on TECHNICAL_DESIGN.md specification.
 */

export const PHYSICS_CONSTANTS = {
  /** Gravity acceleration (m/s²) */
  GRAVITY: 9.8,

  /** Velocity damping per frame (8% friction) */
  DAMPING: 0.92,

  /** Tap force in forward direction (Z-axis) */
  TAP_FORCE: 2.0,

  /** Tap bounce in upward direction (Y-axis) */
  TAP_BOUNCE: 0.5,

  /** Fall angle threshold (60° = π/3 radians) */
  FALL_ANGLE: Math.PI / 3,

  /** Minimum velocity required for fall detection */
  MIN_FALL_VELOCITY: 0.5,

  /** Ring radius for ring-out detection */
  RING_RADIUS: 4.5,
} as const;

// Export commonly used constants
export const FALL_THRESHOLD = 1.0; // Tipping ratio threshold (tipping >= 1.0)
export const RING_RADIUS = PHYSICS_CONSTANTS.RING_RADIUS;
export const TAP_FORCE = PHYSICS_CONSTANTS.TAP_FORCE;
export const TAP_BOUNCE = PHYSICS_CONSTANTS.TAP_BOUNCE;
export const GRAVITY = PHYSICS_CONSTANTS.GRAVITY;
export const DAMPING = PHYSICS_CONSTANTS.DAMPING;
