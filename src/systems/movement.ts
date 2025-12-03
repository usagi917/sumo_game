/**
 * Movement System
 *
 * Simple coordinate-based movement for MVP
 * No physics engine - just direct position updates based on input
 */

import { Vector3 } from 'three';
import { GAME_CONSTANTS } from '../types/game';

/**
 * Calculate new position based on movement direction
 * MVP: Simple linear movement, no acceleration/deceleration
 *
 * @param currentPosition - Current position of the actor
 * @param direction - Movement direction vector (should be normalized)
 * @param deltaTime - Time elapsed since last frame (seconds)
 * @param ringRadius - Ring radius for boundary checking (optional)
 * @returns New position after movement
 */
export function calculateMovement(
  currentPosition: Vector3,
  direction: Vector3,
  deltaTime: number,
  ringRadius?: number
): Vector3 {
  // Calculate movement distance for this frame
  const speed = GAME_CONSTANTS.MOVEMENT_SPEED;
  const distance = speed * deltaTime;

  // Calculate new position
  const movement = direction.clone().normalize().multiplyScalar(distance);
  const newPosition = currentPosition.clone().add(movement);

  // Optional: Clamp to ring boundary
  if (ringRadius !== undefined) {
    const distanceFromCenter = Math.sqrt(newPosition.x ** 2 + newPosition.z ** 2);

    if (distanceFromCenter > ringRadius) {
      // Project position back onto ring edge
      const angle = Math.atan2(newPosition.z, newPosition.x);
      newPosition.x = Math.cos(angle) * ringRadius;
      newPosition.z = Math.sin(angle) * ringRadius;
    }
  }

  // Keep Y at 0 (on the ring surface)
  newPosition.y = 0;

  return newPosition;
}

/**
 * Calculate direction vector from input
 * For MVP: Used by AI to move toward/away from target
 *
 * @param from - Starting position
 * @param to - Target position
 * @returns Normalized direction vector (XZ plane only)
 */
export function getDirectionToTarget(from: Vector3, to: Vector3): Vector3 {
  const direction = new Vector3(to.x - from.x, 0, to.z - from.z);
  return direction.normalize();
}

/**
 * Calculate distance between two positions (XZ plane only)
 * Used for collision detection and AI decision-making
 *
 * @param pos1 - First position
 * @param pos2 - Second position
 * @returns Distance in units
 */
export function getDistance2D(pos1: Vector3, pos2: Vector3): number {
  const dx = pos2.x - pos1.x;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Check if actor is within ring bounds
 * Used for ring-out detection
 *
 * @param position - Actor position to check
 * @param ringRadius - Ring radius
 * @returns true if within ring, false if outside
 */
export function isWithinRing(position: Vector3, ringRadius: number): boolean {
  const distanceFromCenter = Math.sqrt(position.x ** 2 + position.z ** 2);
  return distanceFromCenter <= ringRadius;
}

/**
 * Get position at ring edge in given direction
 * Used for spawning actors at ring edge
 *
 * @param angle - Angle in radians
 * @param ringRadius - Ring radius
 * @returns Position at ring edge
 */
export function getPositionAtRingEdge(angle: number, ringRadius: number): Vector3 {
  return new Vector3(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
}
