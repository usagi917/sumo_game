/**
 * Ring Component
 *
 * 3D sumo ring (dohyo) for battles
 * MVP: Simple cylinder geometry with retro flat color
 */

import { RING_SPECS } from '../../types/game';

/**
 * Ring component props
 */
export interface RingProps {
  /** Ring radius (default: RING_SPECS.radius) */
  radius?: number;
  /** Ring height (default: RING_SPECS.height) */
  height?: number;
  /** Ring color (default: sand/clay color) */
  color?: string;
}

/**
 * Sumo Ring (Dohyo)
 * Simple cylinder mesh for MVP
 */
export default function Ring({ radius = RING_SPECS.radius, height = RING_SPECS.height, color = '#d8c29d' }: RingProps) {
  return (
    <mesh receiveShadow position={[0, height / 2, 0]}>
      {/* Cylinder geometry: (radiusTop, radiusBottom, height, radialSegments) */}
      <cylinderGeometry args={[radius, radius, height, 64]} />
      {/* Simple flat material for retro look */}
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
    </mesh>
  );
}
