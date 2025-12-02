import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const Ring = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <cylinderGeometry args={[4.5, 4.5, 0.3, 64]} />
      <meshStandardMaterial color="#d8c29d" roughness={0.9} />
    </mesh>
  );
};

const Sumo = ({ color, x }: { color: string; x: number }) => (
  <mesh position={[x, 0.75, 0]} castShadow>
    <capsuleGeometry args={[0.5, 0.5, 8, 16]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

export default function App() {
  const deviceDpr = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    return Math.min(Math.max(base, 1), 2); // clamp for perf
  }, []);

  return (
    <div className="app">
      <header>
        <h1>相撲バトル（軽量プレビュー）</h1>
        <p>Three.js は R3F 経由でライトな設定。Vercel にそのままデプロイ可能です。</p>
        <ul>
          <li>低負荷: shadows off by default, dpr clamp 1-2</li>
          <li>必要に応じて `performance` プレセットで更に削減</li>
          <li>本番モデルは GLTF 圧縮（Draco/KTX2）を推奨</li>
        </ul>
      </header>

      <div className="canvas-wrap">
        <Canvas
          gl={{ antialias: false, powerPreference: 'low-power' }}
          dpr={deviceDpr}
          shadows={false}
          camera={{ position: [0, 8, 10], fov: 40 }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          <Suspense fallback={null}>
            <Ring />
            <Sumo color="#4062ff" x={-1.2} />
            <Sumo color="#f05b57" x={1.2} />
            <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.7} maxPolarAngle={1.0} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
