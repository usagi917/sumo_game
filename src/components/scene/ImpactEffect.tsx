/**
 * Impact Effect Component
 *
 * Visual effects when wrestlers collide or push
 * - Dust particles burst on impact
 * - Shockwave ring effect
 * - Flash on contact
 * - Screen shake effect indicator
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayer, useOpponent } from '../../state/gameStore';
import { PHYSICS_CONSTANTS } from '../../physics/constants';

/**
 * Dust Burst Effect - Particles that explode outward on impact
 */
function DustBurst({ position, active }: { position: [number, number, number]; active: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 40;
    const positions = new Float32Array(count * 3);
    const velocities: number[] = [];
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0.5;
      positions[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.15 + Math.random() * 0.25;
      velocities.push(
        Math.cos(angle) * speed,
        Math.random() * 0.2,
        Math.sin(angle) * speed
      );
      sizes[i] = 0.1 + Math.random() * 0.15;
    }
    return { positions, velocities, sizes, count };
  }, []);

  const burstTime = useRef(0);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;

    if (active && !wasActive.current) {
      // Reset on new burst
      burstTime.current = 0;
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particles.count; i++) {
        pos[i * 3] = 0;
        pos[i * 3 + 1] = 0.5;
        pos[i * 3 + 2] = 0;
      }
    }
    wasActive.current = active;

    if (!active) return;

    burstTime.current += delta;
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particles.count; i++) {
      if (burstTime.current < 0.6) {
        pos[i * 3] += particles.velocities[i * 3] * delta * 60;
        pos[i * 3 + 1] += particles.velocities[i * 3 + 1] * delta * 60;
        pos[i * 3 + 2] += particles.velocities[i * 3 + 2] * delta * 60;
        particles.velocities[i * 3 + 1] -= 0.015;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;

    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.opacity = Math.max(0, 1 - burstTime.current * 1.8);
  });

  if (!active) return null;

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="#e8c080"
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Shockwave Ring Effect - Expanding ring on impact
 */
function ShockwaveRing({ position, active }: { position: [number, number, number]; active: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0.1);
  const opacityRef = useRef(1);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!ringRef.current) return;

    if (active && !wasActive.current) {
      scaleRef.current = 0.1;
      opacityRef.current = 1;
    }
    wasActive.current = active;

    if (!active) {
      scaleRef.current = 0.1;
      return;
    }

    scaleRef.current = Math.min(scaleRef.current + delta * 10, 4);
    opacityRef.current = Math.max(0, 1 - scaleRef.current / 4);

    ringRef.current.scale.set(scaleRef.current, scaleRef.current, 1);
    const material = ringRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = opacityRef.current;
  });

  if (!active) return null;

  return (
    <mesh
      ref={ringRef}
      position={[position[0], 0.05, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[0.1, 0.1, 1]}
    >
      <ringGeometry args={[0.8, 1, 32]} />
      <meshBasicMaterial
        color="#ffdd44"
        transparent
        opacity={1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Impact Flash Effect - Quick bright flash on contact
 */
function ImpactFlash({ position, active }: { position: [number, number, number]; active: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const intensityRef = useRef(0);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!lightRef.current) return;

    if (active && !wasActive.current) {
      intensityRef.current = 8;
    }
    wasActive.current = active;

    intensityRef.current = Math.max(0, intensityRef.current - delta * 40);
    lightRef.current.intensity = intensityRef.current;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[position[0], 1.5, position[2]]}
      intensity={0}
      color="#ffcc00"
      distance={8}
      decay={2}
    />
  );
}

/**
 * Danger Zone Indicator - Shows when someone is near the edge
 */
function DangerZone({ playerPos, opponentPos }: {
  playerPos: { x: number; z: number };
  opponentPos: { x: number; z: number };
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;

    const playerDist = Math.sqrt(playerPos.x ** 2 + playerPos.z ** 2);
    const opponentDist = Math.sqrt(opponentPos.x ** 2 + opponentPos.z ** 2);
    const maxDist = Math.max(playerDist, opponentDist);

    const dangerRatio = maxDist / PHYSICS_CONSTANTS.RING_RADIUS;
    const material = ringRef.current.material as THREE.MeshBasicMaterial;

    if (dangerRatio > 0.6) {
      const pulse = Math.sin(state.clock.getElapsedTime() * 8) * 0.3 + 0.5;
      material.opacity = (dangerRatio - 0.6) * 2 * pulse;
      material.color.setHex(dangerRatio > 0.85 ? 0xff3333 : 0xffaa00);
    } else {
      material.opacity = 0;
    }
  });

  return (
    <mesh
      ref={ringRef}
      position={[0, 0.02, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[PHYSICS_CONSTANTS.RING_RADIUS - 0.5, PHYSICS_CONSTANTS.RING_RADIUS, 64]} />
      <meshBasicMaterial
        color="#ff6600"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Main Impact Effect Controller
 */
export default function ImpactEffect() {
  const player = usePlayer();
  const opponent = useOpponent();

  const [showBurst, setShowBurst] = useState(false);
  const [impactPosition, setImpactPosition] = useState<[number, number, number]>([0, 0, 0]);
  const lastCollisionState = useRef(false);

  useEffect(() => {
    const playerPos = player.position;
    const opponentPos = opponent.position;
    const dx = opponentPos.x - playerPos.x;
    const dz = opponentPos.z - playerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    const nowColliding = distance < PHYSICS_CONSTANTS.COLLISION_THRESHOLD;

    if (nowColliding && !lastCollisionState.current) {
      const midX = (playerPos.x + opponentPos.x) / 2;
      const midZ = (playerPos.z + opponentPos.z) / 2;
      setImpactPosition([midX, 0, midZ]);
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 600);
    }

    lastCollisionState.current = nowColliding;
  }, [player.position, opponent.position]);

  return (
    <>
      <DustBurst position={impactPosition} active={showBurst} />
      <ShockwaveRing position={impactPosition} active={showBurst} />
      <ImpactFlash position={impactPosition} active={showBurst} />
      <DangerZone
        playerPos={{ x: player.position.x, z: player.position.z }}
        opponentPos={{ x: opponent.position.x, z: opponent.position.z }}
      />
    </>
  );
}
