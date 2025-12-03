/**
 * Collision Detection System
 *
 * Simple distance-based collision for MVP
 * No complex physics - just distance checks
 */

import { Vector3 } from 'three';
import { RING_SPECS } from '../types/game';

/**
 * Actor collision radius
 * Assumes capsule geometry with radius 0.5
 */
const ACTOR_COLLISION_RADIUS = 0.5;

/**
 * Minimum distance for actions to be effective
 * Must be close enough to push/attack
 */
const ACTION_RANGE = 2.0;

/**
 * Check if two actors are colliding
 * MVP: Simple sphere-sphere collision
 *
 * @param pos1 - First actor position
 * @param pos2 - Second actor position
 * @param radius1 - First actor collision radius (default: ACTOR_COLLISION_RADIUS)
 * @param radius2 - Second actor collision radius (default: ACTOR_COLLISION_RADIUS)
 * @returns true if colliding, false otherwise
 */
export function checkActorCollision(
  pos1: Vector3,
  pos2: Vector3,
  radius1: number = ACTOR_COLLISION_RADIUS,
  radius2: number = ACTOR_COLLISION_RADIUS
): boolean {
  const dx = pos2.x - pos1.x;
  const dz = pos2.z - pos1.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  const minDistance = radius1 + radius2;

  return distance < minDistance;
}

/**
 * Check if actor is within action range of target
 * Used to validate if actions (push, tsuppari, special) can be performed
 *
 * @param attackerPos - Attacker position
 * @param targetPos - Target position
 * @param range - Action range (default: ACTION_RANGE)
 * @returns true if within range, false otherwise
 */
export function isInActionRange(
  attackerPos: Vector3,
  targetPos: Vector3,
  range: number = ACTION_RANGE
): boolean {
  const dx = targetPos.x - attackerPos.x;
  const dz = targetPos.z - attackerPos.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  return distance <= range;
}

/**
 * Check if actor is out of ring (ring-out detection)
 * MVP: Distance from center > ring radius
 *
 * @param position - Actor position to check
 * @param ringRadius - Ring radius (default: RING_SPECS.radius)
 * @returns true if out of ring, false if within ring
 */
export function checkRingOut(
  position: Vector3,
  ringRadius: number = RING_SPECS.radius
): boolean {
  const distanceFromCenter = Math.sqrt(position.x ** 2 + position.z ** 2);
  return distanceFromCenter > ringRadius;
}

/**
 * Resolve collision between two actors
 * Pushes them apart if they're overlapping
 * MVP: Simple separation along collision normal
 *
 * @param pos1 - First actor position (will be modified)
 * @param pos2 - Second actor position (will be modified)
 * @param radius1 - First actor collision radius
 * @param radius2 - Second actor collision radius
 * @returns Object with separated positions
 */
export function resolveCollision(
  pos1: Vector3,
  pos2: Vector3,
  radius1: number = ACTOR_COLLISION_RADIUS,
  radius2: number = ACTOR_COLLISION_RADIUS
): { pos1: Vector3; pos2: Vector3 } {
  const dx = pos2.x - pos1.x;
  const dz = pos2.z - pos1.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  const minDistance = radius1 + radius2;

  // If not overlapping, return original positions
  if (distance >= minDistance) {
    return { pos1: pos1.clone(), pos2: pos2.clone() };
  }

  // Calculate overlap and separation vector
  const overlap = minDistance - distance;
  const separationX = (dx / distance) * (overlap / 2);
  const separationZ = (dz / distance) * (overlap / 2);

  // Separate actors
  const newPos1 = pos1.clone().sub(new Vector3(separationX, 0, separationZ));
  const newPos2 = pos2.clone().add(new Vector3(separationX, 0, separationZ));

  return { pos1: newPos1, pos2: newPos2 };
}

/**
 * Calculate knockback direction
 * Used when applying knockback from actions
 *
 * @param attackerPos - Attacker position
 * @param targetPos - Target position
 * @returns Normalized direction vector from attacker to target
 */
export function getKnockbackDirection(attackerPos: Vector3, targetPos: Vector3): Vector3 {
  const direction = new Vector3(targetPos.x - attackerPos.x, 0, targetPos.z - attackerPos.z);
  return direction.normalize();
}

/**
 * Get closest point on ring edge to a position
 * Used for ring-out calculations
 *
 * @param position - Position to check
 * @param ringRadius - Ring radius
 * @returns Closest point on ring edge
 */
export function getClosestRingEdgePoint(position: Vector3, ringRadius: number): Vector3 {
  const angle = Math.atan2(position.z, position.x);
  return new Vector3(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
}
