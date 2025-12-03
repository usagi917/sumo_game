/**
 * Impact Effect Component
 *
 * Visual effects when wrestlers collide or push
 * - Dust particles burst on impact
 * - Shockwave ring effect
 * - Flash on contact
 */

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayer, useOpponent } from '../../state/gameStore';

/**
 * Calculate distance between two actors
 */
function getDistance(pos1: THREE.Vector3, pos2: THREE.Vector3): number {
  const dx = pos2.x - pos1.x;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Dust Burst Effect
 * Particles that explode outward on impact
 */
function DustBurst({ position, active }: { position: THREE.Vector3; active: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  const [particles] = useState(() => {
    const count = 30;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Start at center
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0.5;
      positions[i * 3 + 2] = 0;
      
      // Random velocity outward
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.1 + Math.random() * 0.2;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = Math.random() * 0.15;
      velocities[i * 3 + 2] = Math.sin(angle) * speed;
      
      lifetimes[i] = Math.random();
    }
    return { positions, velocities, lifetimes, count };
  });
  
  const burstTime = useRef(0);
  
  useFrame((_, delta) => {
    if (!particlesRef.current || !active) return;
    
    burstTime.current += delta;
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    // Update particles
    for (let i = 0; i < particles.count; i++) {
      if (burstTime.current < 0.5) {
        // Explode outward
        pos[i * 3] += particles.velocities[i * 3];
        pos[i * 3 + 1] += particles.velocities[i * 3 + 1];
        pos[i * 3 + 2] += particles.velocities[i * 3 + 2];
        
        // Gravity
        particles.velocities[i * 3 + 1] -= 0.01;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Fade out
    const material = particlesRef.current.material as THREE.PointsMaterial;
    material.opacity = Math.max(0, 1 - burstTime.current * 2);
    
    // Reset after animation
    if (burstTime.current > 0.5) {
      burstTime.current = 0;
      // Reset positions
      for (let i = 0; i < particles.count; i++) {
        pos[i * 3] = 0;
        pos[i * 3 + 1] = 0.5;
        pos[i * 3 + 2] = 0;
      }
    }
  });
  
  if (!active) return null;
  
  return (
    <points ref={particlesRef} position={[position.x, 0, position.z]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#d8a062"
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Shockwave Ring Effect
 * Expanding ring on impact
 */
function ShockwaveRing({ position, active }: { position: THREE.Vector3; active: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  // Use refs instead of state to avoid re-renders in useFrame
  const scaleRef = useRef(0.1);
  const opacityRef = useRef(1);
  
  useFrame((_, delta) => {
    if (!ringRef.current) return;
    
    if (!active) {
      // Reset when inactive
      scaleRef.current = 0.1;
      opacityRef.current = 1;
      return;
    }
    
    // Expand ring
    scaleRef.current = Math.min(scaleRef.current + delta * 8, 3);
    
    // Fade out as it expands
    opacityRef.current = Math.max(0, 1 - scaleRef.current / 3);
    
    // Update mesh directly (no setState!)
    ringRef.current.scale.set(scaleRef.current, scaleRef.current, 1);
    const material = ringRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = opacityRef.current;
    
    // Reset after animation
    if (scaleRef.current >= 3) {
      scaleRef.current = 0.1;
      opacityRef.current = 1;
    }
  });
  
  if (!active) return null;
  
  return (
    <mesh
      ref={ringRef}
      position={[position.x, 0.05, position.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[0.1, 0.1, 1]}
    >
      <ringGeometry args={[0.8, 1, 32]} />
      <meshBasicMaterial
        color="#ffcc00"
        transparent
        opacity={1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Impact Flash Effect
 * Quick bright flash on contact
 */
function ImpactFlash({ position, active }: { position: THREE.Vector3; active: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  // Use ref instead of state to avoid re-renders in useFrame
  const intensityRef = useRef(0);
  
  useFrame((_, delta) => {
    if (!lightRef.current) return;
    
    if (!active) {
      intensityRef.current = 0;
    } else {
      // Flash then fade
      if (intensityRef.current < 5) {
        intensityRef.current = 5;
      } else {
        intensityRef.current = Math.max(0, intensityRef.current - delta * 30);
      }
    }
    
    // Update light directly (no setState!)
    lightRef.current.intensity = intensityRef.current;
  });
  
  return (
    <pointLight
      ref={lightRef}
      position={[position.x, 1, position.z]}
      intensity={0}
      color="#ffaa00"
      distance={5}
      decay={2}
    />
  );
}

/**
 * Collision Indicator
 * Visual line showing contact between wrestlers
 */
function CollisionLine({ 
  pos1, 
  pos2, 
  active 
}: { 
  pos1: THREE.Vector3; 
  pos2: THREE.Vector3; 
  active: boolean;
}) {
  const lineRef = useRef<THREE.Line>(null);
  // Use ref instead of state to avoid re-renders in useFrame
  const opacityRef = useRef(0);
  
  useFrame((state) => {
    if (!lineRef.current) return;
    
    if (active) {
      // Pulsing opacity when colliding
      opacityRef.current = 0.4 + Math.sin(state.clock.getElapsedTime() * 15) * 0.3;
    } else {
      opacityRef.current = Math.max(0, opacityRef.current - 0.1);
    }
    
    // Update material opacity directly (no setState!)
    const material = lineRef.current.material as THREE.LineBasicMaterial;
    material.opacity = opacityRef.current;
    
    // Update line positions
    const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
    positions[0] = pos1.x;
    positions[1] = 1;
    positions[2] = pos1.z;
    positions[3] = pos2.x;
    positions[4] = 1;
    positions[5] = pos2.z;
    lineRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  const points = new Float32Array([0, 1, 0, 0, 1, 0]);
  
  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color="#ff4444" 
        transparent 
        opacity={0}
        linewidth={3}
      />
    </line>
  );
}

/**
 * Main Impact Effect Controller
 * Orchestrates all collision effects
 */
export default function ImpactEffect() {
  const player = usePlayer();
  const opponent = useOpponent();
  
  const [isColliding, setIsColliding] = useState(false);
  const [impactPosition, setImpactPosition] = useState(new THREE.Vector3());
  const [showBurst, setShowBurst] = useState(false);
  const lastCollisionState = useRef(false);
  
  // Collision detection
  useEffect(() => {
    const playerPos = player.position;
    const opponentPos = opponent.position;
    const distance = getDistance(playerPos, opponentPos);
    
    // Collision threshold (actors touching)
    const collisionThreshold = 1.8;
    const nowColliding = distance < collisionThreshold;
    
    setIsColliding(nowColliding);
    
    // Trigger burst on new collision
    if (nowColliding && !lastCollisionState.current) {
      // Calculate midpoint
      const midX = (playerPos.x + opponentPos.x) / 2;
      const midZ = (playerPos.z + opponentPos.z) / 2;
      setImpactPosition(new THREE.Vector3(midX, 0, midZ));
      setShowBurst(true);
      
      // Reset burst after animation
      setTimeout(() => setShowBurst(false), 500);
    }
    
    lastCollisionState.current = nowColliding;
  }, [player.position, opponent.position]);
  
  // Also trigger effects when attacking
  useEffect(() => {
    if (player.state === 'attacking' || opponent.state === 'attacking') {
      const playerPos = player.position;
      const opponentPos = opponent.position;
      const midX = (playerPos.x + opponentPos.x) / 2;
      const midZ = (playerPos.z + opponentPos.z) / 2;
      setImpactPosition(new THREE.Vector3(midX, 0, midZ));
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 500);
    }
  }, [player.state, opponent.state, player.position, opponent.position]);
  
  return (
    <>
      {/* Dust particles on impact */}
      <DustBurst position={impactPosition} active={showBurst} />
      
      {/* Shockwave ring */}
      <ShockwaveRing position={impactPosition} active={showBurst} />
      
      {/* Flash light */}
      <ImpactFlash position={impactPosition} active={showBurst} />
      
      {/* Collision indicator line */}
      <CollisionLine 
        pos1={player.position as THREE.Vector3} 
        pos2={opponent.position as THREE.Vector3} 
        active={isColliding} 
      />
    </>
  );
}

