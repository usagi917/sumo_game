/**
 * Actor Component
 *
 * 3D representation of a sumo wrestler (player or AI)
 * Renders as a 2D paper-sumo style character using generated pixel art texture.
 * Enhanced with collision and push visual effects.
 */

import { useRef, useMemo, useState } from 'react';
import { CanvasTexture, DoubleSide, NearestFilter, type Mesh, Color, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Actor as ActorType, ActorState } from '../../types/game';
import { generateSumoTexture } from '../../utils/textureGenerator';

/**
 * Actor component props
 */
export interface ActorProps {
  /** Actor data from game state */
  actor: ActorType;
  /** Actor color */
  color: string;
}

/**
 * Sumo Actor (Wrestler)
 * Paper-sumo style 2D plane with pixel art texture
 * Enhanced with dramatic collision/push effects
 */
export default function Actor({ actor, color }: ActorProps) {
  const meshRef = useRef<Mesh>(null);
  const isOpponent = actor.id === 'opponent';
  
  // Track previous state for transition effects
  const [prevState, setPrevState] = useState(actor.state);
  const attackTime = useRef(0);
  const damageTime = useRef(0);

  // Generate pixel art texture
  const texture = useMemo(() => {
    const canvas = generateSumoTexture(color, isOpponent);
    const tex = new CanvasTexture(canvas);
    // Pixel perfect scaling
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;
    // Update texture to ensure it renders
    tex.needsUpdate = true;
    return tex;
  }, [color, isOpponent]);

  // Paper sumo size - 大きくして見やすく！
  const size = 2.8; 
  // Center pivot is at center of plane, so move up by half height to stand on ground
  const yPosition = size / 2;
  
  // Base emissive color
  const baseEmissive = useMemo(() => new Color(color), [color]);

  // Animation state
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const material = meshRef.current.material as MeshStandardMaterial;
    
    // Detect state transitions
    if (actor.state !== prevState) {
      if (actor.state === 'attacking') {
        attackTime.current = 0;
      } else if (actor.state === 'damaged') {
        damageTime.current = 0;
      }
      setPrevState(actor.state);
    }

    // Base bobbing animation (idle breathing)
    let bobOffset = Math.sin(time * 6) * 0.08;
    let posX = actor.position.x;
    let posZ = actor.position.z;
    let scaleX = 1.0;
    let scaleY = 1.0;
    
    // Visual effects based on state
    if (actor.state === 'attacking') {
      attackTime.current += delta;
      const attackProgress = Math.min(attackTime.current / 0.3, 1);
      
      // Dramatic lunge forward effect
      const lungeAmount = Math.sin(attackProgress * Math.PI) * 0.5;
      const lungeDirection = isOpponent ? 1 : -1;
      posX += lungeDirection * lungeAmount;
      
      // Squash and stretch - wider and shorter during push
      scaleX = 1.0 + Math.sin(attackProgress * Math.PI) * 0.4;
      scaleY = 1.0 - Math.sin(attackProgress * Math.PI) * 0.15;
      
      // Intense bobbing during attack
      bobOffset = Math.sin(time * 30) * 0.15;
      
      // Glow effect during attack
      material.emissive.copy(baseEmissive);
      material.emissiveIntensity = 0.8 * (1 - attackProgress);
      material.opacity = 1.0;
      
    } else if (actor.state === 'damaged') {
      damageTime.current += delta;
      const damageProgress = Math.min(damageTime.current / 0.2, 1);
      
      // Violent shake effect
      const shakeIntensity = (1 - damageProgress) * 0.4;
      posX += (Math.random() - 0.5) * shakeIntensity;
      posZ += (Math.random() - 0.5) * shakeIntensity * 0.5;
      
      // Squish effect when hit
      scaleX = 1.0 - Math.sin(damageProgress * Math.PI) * 0.2;
      scaleY = 1.0 + Math.sin(damageProgress * Math.PI) * 0.1;
      
      // Flash red and fade
      material.emissive.setHex(0xff0000);
      material.emissiveIntensity = 0.8 * (1 - damageProgress);
      material.opacity = 0.6 + Math.sin(time * 40) * 0.4;
      
      // Knocked back bounce
      bobOffset += Math.sin(damageProgress * Math.PI * 2) * 0.2;
      
    } else {
      // Idle state - subtle breathing
      scaleX = 1.0 + Math.sin(time * 2) * 0.02;
      scaleY = 1.0 - Math.sin(time * 2) * 0.02;
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
      material.opacity = 1.0;
    }
    
    // Apply final transforms
    meshRef.current.position.set(posX, yPosition + bobOffset, posZ);
    meshRef.current.scale.set(scaleX * size, scaleY * size, 1);

    // Billboard effect: Always face camera but keep upright (Y-axis rotation only)
    meshRef.current.lookAt(state.camera.position.x, meshRef.current.position.y, state.camera.position.z);
  });

  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
    >
      {/* Paper plane geometry - size 1, scaled in useFrame */}
      <planeGeometry args={[1, 1]} />
      {/* Pixel art material with transparency */}
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.5} // Cutout transparency for crisp edges
        side={DoubleSide}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}
