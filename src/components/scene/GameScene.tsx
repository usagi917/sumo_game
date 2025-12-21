/**
 * Game Scene Component
 *
 * Complete 3D scene for the sumo battle
 * Contains ring, actors, camera, lights
 * シンプル版：お相撲さんと土俵だけ！
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import Ring from './Ring';
import Actor from './Actor';
import ImpactEffect from './ImpactEffect';
import { usePlayer, useOpponent } from '../../state/gameStore';
import type { Actor as ActorType, ActorState } from '../../types/game';

/**
 * Convert PhysicsState to Actor type with visual state
 */
function toActor(
  physics: ReturnType<typeof usePlayer>,
  id: 'player' | 'opponent',
  otherPhysics: ReturnType<typeof usePlayer>
): ActorType {
  // Determine visual state based on physics
  let state: ActorState = 'idle';

  const speed = Math.sqrt(
    physics.velocity.x ** 2 + physics.velocity.y ** 2 + physics.velocity.z ** 2
  );

  // If moving fast toward opponent, attacking
  if (speed > 1.5) {
    const movingToward = id === 'player'
      ? physics.velocity.z < -0.5
      : physics.velocity.z > 0.5;
    if (movingToward) {
      state = 'attacking';
    }
  }

  // If being pushed back or tipping, damaged
  if (physics.tipping > 0.3) {
    state = 'damaged';
  }

  return {
    id,
    state,
    position: { x: physics.position.x, y: physics.position.y, z: physics.position.z },
    velocity: { x: physics.velocity.x, y: physics.velocity.y, z: physics.velocity.z },
    rotation: { x: physics.rotation.x, y: physics.rotation.y, z: physics.rotation.z },
    tipping: physics.tipping,
    isFallen: physics.isFallen,
  };
}

/**
 * Game Scene Props
 */
export interface GameSceneProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * 3D Scene Contents
 * Separated for Suspense boundary
 */
function SceneContents() {
  const playerPhysics = usePlayer();
  const opponentPhysics = useOpponent();

  // Convert physics state to actor with visual state
  const player = toActor(playerPhysics, 'player', opponentPhysics);
  const opponent = toActor(opponentPhysics, 'opponent', playerPhysics);

  return (
    <>

      {/* OrbitControls - 向正面から見る（回転制限付き） */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={6}
        maxDistance={14}
        // 上下の回転を制限（斜め上から見下ろす）
        maxPolarAngle={Math.PI / 2.5} // 72度まで
        minPolarAngle={Math.PI / 5}   // 36度から
        // 水平方向の回転も制限
        minAzimuthAngle={-Math.PI / 4} // 左45度まで
        maxAzimuthAngle={Math.PI / 4}  // 右45度まで
        rotateSpeed={0.3}
        zoomSpeed={0.8}
        // 土俵の中心を見る
        target={[0, 0, 0]}
        // タッチ操作のサポート
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      {/* シンプルな照明 */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      {/* 背景色 */}
      <color attach="background" args={['#1a1a2e']} />

      {/* Sumo ring - 土俵 */}
      <Ring />

      {/* Player (blue) - あなた */}
      <Actor actor={player} color="#4062ff" />

      {/* Opponent (red) - あいて */}
      <Actor actor={opponent} color="#f05b57" />

      {/* Impact effects when wrestlers collide */}
      <ImpactEffect />
    </>
  );
}


/**
 * Complete Game Scene
 * Canvas with optimized settings for mobile performance
 */
export default function GameScene({ className }: GameSceneProps) {
  // Optimize device pixel ratio for performance
  const deviceDpr = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    // Clamp DPR between 1 and 2 for performance
    return Math.min(Math.max(window.devicePixelRatio, 1), 2);
  }, []);

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        // Performance optimizations
        gl={{
          antialias: true, // Enable for smoother edges
          powerPreference: 'high-performance',
        }}
        dpr={deviceDpr}
        shadows={true}
        // Camera setup - 向正面から見る（プレイヤーが奥、相手が手前）
        camera={{
          position: [0, 7, -12],
          fov: 40,
          near: 0.1,
          far: 100,
        }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  );
}
