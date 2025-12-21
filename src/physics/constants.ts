/**
 * Physics Constants
 *
 * Custom physics engine constants for tonton sumo simulation.
 * Tuned for exciting, dynamic gameplay!
 */

export const PHYSICS_CONSTANTS = {
  /** Gravity acceleration (m/s²) - slightly reduced for floatier feel */
  GRAVITY: 8.0,

  /** Velocity damping per frame - lower = more sliding/momentum */
  DAMPING: 0.88,

  /** Tap force in forward direction (Z-axis) - increased for impact */
  TAP_FORCE: 2.8,

  /** Tap bounce in upward direction (Y-axis) */
  TAP_BOUNCE: 0.4,

  /** Fall angle threshold (60° = π/3 radians) */
  FALL_ANGLE: Math.PI / 3,

  /** Minimum velocity required for fall detection */
  MIN_FALL_VELOCITY: 0.4,

  /** Ring radius for ring-out detection */
  RING_RADIUS: 4.5,

  /** Collision restitution (bounciness) */
  COLLISION_RESTITUTION: 0.65,

  /** Collision distance threshold */
  COLLISION_THRESHOLD: 1.2,

  /** Angular wobble intensity on tap */
  WOBBLE_INTENSITY: 1.2,
} as const;

// Export commonly used constants
export const FALL_THRESHOLD = 1.0; // Tipping ratio threshold (tipping >= 1.0)
export const RING_RADIUS = PHYSICS_CONSTANTS.RING_RADIUS;
export const TAP_FORCE = PHYSICS_CONSTANTS.TAP_FORCE;
export const TAP_BOUNCE = PHYSICS_CONSTANTS.TAP_BOUNCE;
export const GRAVITY = PHYSICS_CONSTANTS.GRAVITY;
export const DAMPING = PHYSICS_CONSTANTS.DAMPING;
