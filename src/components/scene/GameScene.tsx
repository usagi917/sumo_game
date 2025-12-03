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
  const player = usePlayer();
  const opponent = useOpponent();

  return (
    <>

      {/* OrbitControls - 回転を制限してお相撲さんが常に見えるように */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={12}
        // 上下の回転を厳しく制限（常に斜め上から見下ろす）
        maxPolarAngle={Math.PI / 3} // 60度まで（真横に行かない）
        minPolarAngle={Math.PI / 6} // 30度から（真上に行かない）
        // 水平方向の回転も制限（正面付近のみ）
        minAzimuthAngle={-Math.PI / 3} // 左60度まで
        maxAzimuthAngle={Math.PI / 3}  // 右60度まで
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
        // Camera setup - 斜め上から見下ろす固定アングル（相撲中継っぽく！）
        camera={{
          position: [0, 6, 10],
          fov: 45,
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
