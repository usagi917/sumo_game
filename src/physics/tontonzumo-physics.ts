/**
 * Tonton Zumo Physics Engine
 *
 * Custom ~100-line physics simulation for tonton sumo game.
 * Implements gravity, damping, collision, and tipping mechanics.
 *
 * Based on TECHNICAL_DESIGN.md specification.
 */

import { Vector3, Euler } from 'three';
import { PHYSICS_CONSTANTS } from './constants';

/**
 * Physics state for a sumo wrestler
 */
export interface PhysicsState {
  position: Vector3;
  velocity: Vector3;
  angularVelocity: number;
  rotation: Euler;
  tipping: number; // 0-1 (傾き度)
  isFallen: boolean;
}

/**
 * Update actor physics state
 *
 * @param actor - Physics state
 * @param deltaTime - Frame time (seconds)
 * @returns Updated physics state
 */
export function updateActorPhysics(
  actor: PhysicsState,
  deltaTime: number
): PhysicsState {
  const newActor: PhysicsState = {
    position: actor.position.clone(),
    velocity: actor.velocity.clone(),
    angularVelocity: actor.angularVelocity,
    rotation: actor.rotation.clone(),
    tipping: actor.tipping,
    isFallen: actor.isFallen,
  };

  // 1. Apply gravity
  newActor.velocity.y -= PHYSICS_CONSTANTS.GRAVITY * deltaTime;

  // 2. Update position (position = position + velocity * time)
  newActor.position.add(newActor.velocity.clone().multiplyScalar(deltaTime));

  // 3. Ground collision detection
  if (newActor.position.y < 0) {
    newActor.position.y = 0;
    newActor.velocity.y = 0;
  }

  // 4. Apply damping (friction/air resistance)
  newActor.velocity.multiplyScalar(PHYSICS_CONSTANTS.DAMPING);

  // 5. Update rotation
  newActor.rotation.x += newActor.angularVelocity * deltaTime;

  // 6. Apply rotation damping
  newActor.angularVelocity *= 0.95;

  // 7. Calculate tipping ratio (0-1)
  newActor.tipping =
    Math.abs(newActor.rotation.x) / PHYSICS_CONSTANTS.FALL_ANGLE;

  // 8. Fall detection
  if (
    newActor.tipping >= 1.0 &&
    newActor.velocity.length() > PHYSICS_CONSTANTS.MIN_FALL_VELOCITY
  ) {
    newActor.isFallen = true;
  }

  return newActor;
}

/**
 * Apply tap force to actor
 *
 * @param actor - Physics state (modified in place)
 * @param tapRate - Tap rate (taps/second)
 */
export function applyTapForce(actor: PhysicsState, tapRate: number): void {
  // Forward force (Z-axis)
  actor.velocity.z += PHYSICS_CONSTANTS.TAP_FORCE;

  // Upward bounce (Y-axis)
  actor.velocity.y += PHYSICS_CONSTANTS.TAP_BOUNCE;

  // Random wobble (X-axis rotation)
  actor.angularVelocity += random(-0.1, 0.1);
}

/**
 * Resolve collision between two actors
 *
 * @param actor1 - First wrestler
 * @param actor2 - Second wrestler
 */
export function resolveCollision(
  actor1: PhysicsState,
  actor2: PhysicsState
): void {
  const distance = actor1.position.distanceTo(actor2.position);
  const collisionThreshold = 1.0; // Collision distance threshold

  if (distance < collisionThreshold) {
    // Collision direction vector
    const direction = actor2.position
      .clone()
      .sub(actor1.position)
      .normalize();

    // Restitution (simplified momentum conservation)
    const restitution = 0.5; // Coefficient of restitution
    const relativeVelocity = actor1.velocity.clone().sub(actor2.velocity);
    const impactSpeed = relativeVelocity.dot(direction);

    if (impactSpeed > 0) {
      // Apply restitution only if colliding
      const impulse = direction.multiplyScalar(impactSpeed * restitution);

      actor1.velocity.sub(impulse);
      actor2.velocity.add(impulse);

      // Position correction (prevent overlap)
      const overlap = collisionThreshold - distance;
      const correction = direction.multiplyScalar(overlap * 0.5);

      actor1.position.sub(correction);
      actor2.position.add(correction);
    }
  }
}

/**
 * Check if position is outside ring
 *
 * @param position - Wrestler position
 * @returns True if ring out
 */
export function isRingOut(position: Vector3): boolean {
  // Distance from center (XZ plane)
  const distanceFromCenter = Math.sqrt(
    position.x * position.x + position.z * position.z
  );

  return distanceFromCenter > PHYSICS_CONSTANTS.RING_RADIUS;
}

/**
 * Random value generator (min~max)
 */
function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
