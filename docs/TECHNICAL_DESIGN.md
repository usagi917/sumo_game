# 技術設計仕様

レトロ風トントン相撲ゲームの技術的な実装詳細を説明します。

---

## 設計原則

### Ruthless Simplicity（徹底的なシンプルさ）

- 最小限の技術スタックで最大の効果
- 複雑な物理エンジンライブラリは使用しない
- ~100行のカスタム物理シミュレーション
- Zustandで状態管理を一元化

### 技術選択の理由

**Three.js + カスタム物理エンジン**：
- ✅ バンドルサイズ削減（外部物理ライブラリ不要）
- ✅ 完全な制御（ゲームデザインに最適化）
- ✅ デバッグ容易（~100行のシンプルな物理演算）
- ✅ パフォーマンス最適化（必要な物理のみ実装）

**Zustand状態管理**：
- ✅ Redux不要（シンプルなAPI）
- ✅ TypeScript完全対応
- ✅ React Devtools連携
- ✅ 最小限のボイラープレート

**React + @react-three/fiber**：
- ✅ React宣言的UI
- ✅ Three.jsのReact統合
- ✅ useFrameフック（物理シミュレーションループ）
- ✅ コンポーネント再利用性

**代替案との比較**：
- ❌ Cannon.js/Rapier: ~200-500KB、オーバースペック
- ❌ Redux: 状態管理が複雑すぎる
- ❌ 生Three.js: Reactとの統合が困難
- ❌ フル物理エンジン: トントン相撲には不要な機能が多い

---

## 状態管理システム

### Zustandストア

```typescript
// state/gameStore.ts
interface PhysicsState {
  position: Vector3;
  velocity: Vector3;
  angularVelocity: number;
  rotation: Euler;
  tipping: number;         // 傾き度（0-1）
  isFallen: boolean;
}

interface GameState {
  // プレイヤー状態
  player: PhysicsState;

  // 対戦相手状態
  opponent: PhysicsState;

  // ゲーム状態
  gameStatus: 'title' | 'battle' | 'result';
  winner: 'player' | 'opponent' | null;

  // タップ追跡
  tapTracker: TapTracker;

  // アクション
  executeTap: () => void;                          // プレイヤーのタップ
  updatePhysics: (deltaTime: number) => void;     // 物理演算更新
  checkVictory: () => void;                       // 勝敗判定
  resetGame: () => void;
}

const useGameStore = create<GameState>((set, get) => ({
  // 初期状態
  player: {
    position: new Vector3(0, 0, 3),
    velocity: new Vector3(0, 0, 0),
    angularVelocity: 0,
    rotation: new Euler(0, 0, 0),
    tipping: 0,
    isFallen: false,
  },

  opponent: {
    position: new Vector3(0, 0, -3),
    velocity: new Vector3(0, 0, 0),
    angularVelocity: 0,
    rotation: new Euler(0, 0, 0),
    tipping: 0,
    isFallen: false,
  },

  gameStatus: 'title',
  winner: null,
  tapTracker: new TapTracker(),

  // タップ実行
  executeTap: () => {
    const state = get();

    // バトル中のみ実行
    if (state.gameStatus !== 'battle') return;

    // タップ記録
    state.tapTracker.addTap();

    // 物理エンジンに力を加える
    const tapRate = state.tapTracker.getTapRate();
    set((prev) => ({
      player: {
        ...prev.player,
        velocity: prev.player.velocity.clone().add(
          new Vector3(0, TAP_BOUNCE, TAP_FORCE)
        ),
        angularVelocity: prev.player.angularVelocity + random(-0.1, 0.1),
      },
    }));
  },

  // 物理演算更新
  updatePhysics: (deltaTime) => {
    const state = get();

    // プレイヤー物理更新
    const newPlayer = updateActorPhysics(state.player, deltaTime);

    // AI物理更新
    const newOpponent = updateActorPhysics(state.opponent, deltaTime);

    // 衝突判定
    resolveCollision(newPlayer, newOpponent);

    set({
      player: newPlayer,
      opponent: newOpponent,
    });

    // 勝利判定
    get().checkVictory();
  },

  // 勝利判定
  checkVictory: () => {
    const { player, opponent } = get();

    // 転倒判定（60°以上）
    if (player.tipping > FALL_THRESHOLD) {
      set({ winner: 'opponent', gameStatus: 'result' });
      return;
    }

    if (opponent.tipping > FALL_THRESHOLD) {
      set({ winner: 'player', gameStatus: 'result' });
      return;
    }

    // 土俵外判定（4.5 units以上）
    if (player.position.length() > RING_RADIUS) {
      set({ winner: 'opponent', gameStatus: 'result' });
      return;
    }

    if (opponent.position.length() > RING_RADIUS) {
      set({ winner: 'player', gameStatus: 'result' });
      return;
    }
  },

  // ゲームリセット
  resetGame: () => {
    set({
      player: {
        position: new Vector3(0, 0, 3),
        velocity: new Vector3(0, 0, 0),
        angularVelocity: 0,
        rotation: new Euler(0, 0, 0),
        tipping: 0,
        isFallen: false,
      },
      opponent: {
        position: new Vector3(0, 0, -3),
        velocity: new Vector3(0, 0, 0),
        angularVelocity: 0,
        rotation: new Euler(0, 0, 0),
        tipping: 0,
        isFallen: false,
      },
      gameStatus: 'title',
      winner: null,
      tapTracker: new TapTracker(),
    });
  },
}));
```

### 物理定数

```typescript
// physics/constants.ts
export const PHYSICS_CONSTANTS = {
  GRAVITY: 9.8,              // m/s²
  DAMPING: 0.92,             // 8% friction per frame
  TAP_FORCE: 2.0,            // 前方への力
  TAP_BOUNCE: 0.5,           // 上方への跳ね
  FALL_ANGLE: Math.PI / 3,   // 60° = π/3 rad
  MIN_FALL_VELOCITY: 0.5,    // 転倒に必要な最小速度
  RING_RADIUS: 4.5,          // 土俵半径
};

export const FALL_THRESHOLD = PHYSICS_CONSTANTS.FALL_ANGLE;
export const RING_RADIUS = PHYSICS_CONSTANTS.RING_RADIUS;
export const TAP_FORCE = PHYSICS_CONSTANTS.TAP_FORCE;
export const TAP_BOUNCE = PHYSICS_CONSTANTS.TAP_BOUNCE;
```

---

## トントン物理エンジン

### カスタム物理シミュレーション（~100行）

```typescript
// physics/tontonzumo-physics.ts

/**
 * アクターの物理状態を更新
 *
 * @param actor - 物理状態
 * @param deltaTime - フレーム時間（秒）
 * @returns 更新された物理状態
 */
function updateActorPhysics(
  actor: PhysicsState,
  deltaTime: number
): PhysicsState {
  const newActor = { ...actor };

  // 1. 重力適用
  newActor.velocity.y -= PHYSICS_CONSTANTS.GRAVITY * deltaTime;

  // 2. 速度更新（位置 = 位置 + 速度 * 時間）
  newActor.position = actor.position.clone().add(
    actor.velocity.clone().multiplyScalar(deltaTime)
  );

  // 3. 地面接地判定
  if (newActor.position.y < 0) {
    newActor.position.y = 0;
    newActor.velocity.y = 0;
  }

  // 4. 減衰（摩擦・空気抵抗）
  newActor.velocity.multiplyScalar(PHYSICS_CONSTANTS.DAMPING);

  // 5. 回転更新
  newActor.rotation.x += newActor.angularVelocity * deltaTime;

  // 6. 回転の減衰
  newActor.angularVelocity *= 0.95;

  // 7. 傾き度計算（0-1）
  newActor.tipping = Math.abs(newActor.rotation.x) / PHYSICS_CONSTANTS.FALL_ANGLE;

  // 8. 転倒判定
  if (newActor.tipping >= 1.0 && newActor.velocity.length() > PHYSICS_CONSTANTS.MIN_FALL_VELOCITY) {
    newActor.isFallen = true;
  }

  return newActor;
}

/**
 * タップ時の力を適用
 *
 * @param actor - 物理状態
 * @param tapRate - タップ速度（回/秒）
 */
function applyTapForce(actor: PhysicsState, tapRate: number): void {
  // 前方への力（Z軸）
  actor.velocity.z += PHYSICS_CONSTANTS.TAP_FORCE;

  // 上方への跳ね（Y軸）
  actor.velocity.y += PHYSICS_CONSTANTS.TAP_BOUNCE;

  // ランダムな揺れ（X軸回転）
  actor.angularVelocity += random(-0.1, 0.1);
}

/**
 * 2アクター間の衝突判定と解決
 *
 * @param actor1 - 力士1
 * @param actor2 - 力士2
 */
function resolveCollision(actor1: PhysicsState, actor2: PhysicsState): void {
  const distance = actor1.position.distanceTo(actor2.position);
  const collisionThreshold = 1.0; // 衝突距離閾値

  if (distance < collisionThreshold) {
    // 衝突方向ベクトル
    const direction = actor2.position.clone().sub(actor1.position).normalize();

    // 反発力（運動量保存の簡易版）
    const restitution = 0.5; // 反発係数
    const relativeVelocity = actor1.velocity.clone().sub(actor2.velocity);
    const impactSpeed = relativeVelocity.dot(direction);

    if (impactSpeed > 0) {
      // 衝突している場合のみ反発
      const impulse = direction.multiplyScalar(impactSpeed * restitution);

      actor1.velocity.sub(impulse);
      actor2.velocity.add(impulse);

      // 位置補正（めり込み防止）
      const overlap = collisionThreshold - distance;
      const correction = direction.multiplyScalar(overlap * 0.5);

      actor1.position.sub(correction);
      actor2.position.add(correction);
    }
  }
}

/**
 * 土俵外判定
 *
 * @param position - 力士の位置
 * @returns 土俵外の場合true
 */
function isRingOut(position: Vector3): boolean {
  // 土俵中心からの距離（XZ平面）
  const distanceFromCenter = Math.sqrt(
    position.x * position.x + position.z * position.z
  );

  return distanceFromCenter > PHYSICS_CONSTANTS.RING_RADIUS;
}

/**
 * ランダム値生成（min～max）
 */
function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
```

### 物理ループ（固定タイムステップ）

```typescript
// game/game-loop.ts

class GameLoop {
  private fixedDeltaTime = 1 / 60; // 60fps物理更新
  private accumulator = 0;

  update(deltaTime: number): void {
    this.accumulator += deltaTime;

    // 固定タイムステップで物理更新
    while (this.accumulator >= this.fixedDeltaTime) {
      // 物理エンジン更新
      useGameStore.getState().updatePhysics(this.fixedDeltaTime);

      this.accumulator -= this.fixedDeltaTime;
    }

    // 可変タイムステップでレンダリング
    // （React Three Fiberが自動処理）
  }
}
```

---

## タップ追跡システム

### TapTrackerクラス

```typescript
// systems/tap-tracker.ts

/**
 * タップ速度を追跡するクラス
 *
 * 1秒間のスライディングウィンドウでタップ速度を計測
 */
class TapTracker {
  private taps: number[] = [];        // タイムスタンプ配列
  private readonly windowSize = 1000; // 1秒（ミリ秒）

  /**
   * タップを記録
   *
   * @param timestamp - タップ時刻（省略時は現在時刻）
   */
  addTap(timestamp?: number): void {
    const now = timestamp ?? performance.now();
    this.taps.push(now);

    // 古いタップを削除（1秒以上前）
    this.removeOldTaps(now);
  }

  /**
   * タップ速度を取得
   *
   * @returns タップ/秒
   */
  getTapRate(): number {
    const now = performance.now();
    this.removeOldTaps(now);

    // 1秒間のタップ数
    return this.taps.length;
  }

  /**
   * クリア
   */
  clear(): void {
    this.taps = [];
  }

  /**
   * 古いタップを削除
   *
   * @param currentTime - 現在時刻
   */
  private removeOldTaps(currentTime: number): void {
    const cutoff = currentTime - this.windowSize;
    this.taps = this.taps.filter((t) => t > cutoff);
  }
}
```

### タップフロー

```
User Tap Input
    ↓
executeTap() - Zustand action
    ↓
tapTracker.addTap() - タイムスタンプ記録
    ↓
getTapRate() - 直近1秒のタップ数計算
    ↓
applyTapForce(actor, tapRate) - 物理エンジンに力を加える
    ├→ velocity.z += TAP_FORCE (前方へ)
    ├→ velocity.y += TAP_BOUNCE (上方へ)
    └→ angularVelocity += random(-0.1, 0.1) (揺れ)
        ↓
updatePhysics(deltaTime) - 物理演算実行
    ├→ 重力適用
    ├→ 速度更新
    ├→ 位置更新
    ├→ 減衰適用
    └→ 傾き計算
        ↓
checkVictory() - 勝敗判定
    ├→ 転倒判定（tipping >= 1.0）
    └→ 土俵外判定（distance > 4.5）
```

---

## AIシステム

### AI行動エンジン

```typescript
// systems/ai.ts

class AIEngine {
  private tapInterval = 0;
  private nextTapTime = 0;

  /**
   * AI行動決定
   *
   * @param self - AI自身の物理状態
   * @param opponent - 対戦相手の物理状態
   * @returns タップすべきか、タップ速度
   */
  decide(
    self: PhysicsState,
    opponent: PhysicsState
  ): { shouldTap: boolean; tapRate: number } {
    const distance = self.position.distanceTo(opponent.position);

    // 状態に応じてタップ速度を調整
    let targetTapRate: number;

    // 近距離: 高速タップ
    if (distance < 2.0) {
      targetTapRate = random(8, 12); // 8～12回/秒
    }
    // 自身が傾いている: 安定化のため控えめ
    else if (self.tipping > 0.6) {
      targetTapRate = random(4, 6); // 4～6回/秒
    }
    // 相手が傾いている: 攻撃チャンス
    else if (opponent.tipping > 0.5) {
      targetTapRate = random(10, 15); // 10～15回/秒
    }
    // デフォルト: 中程度
    else {
      targetTapRate = random(5, 8); // 5～8回/秒
    }

    // タップ間隔計算（秒）
    this.tapInterval = 1.0 / targetTapRate;

    return {
      shouldTap: true,
      tapRate: targetTapRate,
    };
  }

  /**
   * フレーム更新
   *
   * @param deltaTime - 経過時間
   * @param executeTap - タップ実行関数
   */
  update(deltaTime: number, executeTap: () => void): void {
    this.nextTapTime -= deltaTime;

    if (this.nextTapTime <= 0) {
      executeTap();
      this.nextTapTime = this.tapInterval;
    }
  }
}
```

### AI実行ループ

```typescript
// React Three FiberのuseFrame内
useFrame((state, delta) => {
  const { player, opponent, gameStatus } = useGameStore.getState();

  if (gameStatus !== 'battle') return;

  // AI行動決定
  const decision = aiEngine.decide(opponent, player);

  // AIタップ実行
  if (decision.shouldTap) {
    aiEngine.update(delta, () => {
      // 相手にタップ力を適用
      applyTapForce(opponent, decision.tapRate);
    });
  }

  // 物理演算更新
  useGameStore.getState().updatePhysics(delta);
});
```

---

## レンダリングシステム

### React Three Fiberゲームループ

```typescript
// scene/Game.tsx
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../state/gameStore';

export function Game() {
  const updatePhysics = useGameStore((s) => s.updatePhysics);
  const checkVictory = useGameStore((s) => s.checkVictory);

  // ゲームループ（60fps）
  useFrame((state, delta) => {
    // 1. 物理演算更新
    updatePhysics(delta);

    // 2. AI更新
    updateAI(delta);

    // 3. 勝利判定
    checkVictory();
  });

  return (
    <>
      <Ring />
      <Sumo actor={player} isPlayer={true} />
      <Sumo actor={opponent} isPlayer={false} />
    </>
  );
}
```

### Three.jsシーン設定

```typescript
// App.tsx
import { Canvas } from '@react-three/fiber';

function App() {
  return (
    <Canvas
      camera={{
        position: [8, 8, 8],
        fov: 45,
      }}
      gl={{
        antialias: false, // レトロ感のためアンチエイリアスなし
        powerPreference: 'high-performance',
      }}
    >
      {/* ライティング */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />

      {/* ゲームシーン */}
      <Game />
    </Canvas>
  );
}
```

---

## 3Dモデルシステム

### 力士コンポーネント（Capsule）

```typescript
// scene/models/Sumo.tsx
import { useGameStore } from '../../state/gameStore';

interface SumoProps {
  actor: PhysicsState;
  isPlayer: boolean;
}

export function Sumo({ actor, isPlayer }: SumoProps): JSX.Element {
  // 傾き度に応じた色変更
  const color = getTippingColor(actor.tipping);

  return (
    <mesh
      position={actor.position}
      rotation={actor.rotation}
    >
      {/* カプセルジオメトリ */}
      <capsuleGeometry args={[0.5, 1.0, 8, 16]} />

      {/* マテリアル */}
      <meshStandardMaterial
        color={color}
        flatShading // レトロなポリゴン感
      />
    </mesh>
  );
}

/**
 * 傾き度に応じた色を返す
 */
function getTippingColor(tipping: number): string {
  if (tipping < 0.3) return '#00ff00'; // 安定（緑）
  if (tipping < 0.7) return '#ffff00'; // 警告（黄）
  return '#ff0000';                    // 危険（赤）
}
```

### 土俵コンポーネント

```typescript
// scene/models/Ring.tsx
export function Ring(): JSX.Element {
  return (
    <group>
      {/* 土俵本体 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[4.5, 4.5, 0.2, 32]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* 土俵縁（トーラス） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.5, 0.1, 16, 100]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>
    </group>
  );
}
```

---

## UIシステム

### HUDコンポーネント

```typescript
// ui/components/HUD.tsx
export function HUD() {
  const player = useGameStore((s) => s.player);
  const opponent = useGameStore((s) => s.opponent);
  const gameStatus = useGameStore((s) => s.gameStatus);

  return (
    <div className="hud">
      <div className="hud-top">
        {/* プレイヤー傾きインジケーター */}
        <TippingIndicator
          label="プレイヤー"
          tipping={player.tipping}
          isPlayer={true}
        />

        {/* 対戦相手傾きインジケーター */}
        <TippingIndicator
          label="対戦相手"
          tipping={opponent.tipping}
          isPlayer={false}
        />
      </div>

      {/* 試合ステータス */}
      <div className="hud-status">
        {gameStatus === 'title' && 'トントン相撲'}
        {gameStatus === 'battle' && '勝負！'}
        {gameStatus === 'result' && '勝敗決定'}
      </div>
    </div>
  );
}
```

### 傾きインジケーター

```typescript
// ui/components/TippingIndicator.tsx
interface TippingIndicatorProps {
  label: string;
  tipping: number; // 0-1
  isPlayer: boolean;
}

export function TippingIndicator({
  label,
  tipping,
  isPlayer,
}: TippingIndicatorProps) {
  const percentage = Math.min(100, tipping * 100);
  const color = getTippingColor(tipping);

  return (
    <div className="tipping-indicator">
      <span className="tipping-label">{label}</span>

      {/* 傾きバー */}
      <div className="tipping-bar">
        <div
          className="tipping-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* パーセンテージ表示 */}
      <span className="tipping-percentage">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}
```

### トンボタンコンポーネント

```typescript
// ui/components/TonButton.tsx
export function TonButton() {
  const executeTap = useGameStore((s) => s.executeTap);
  const gameStatus = useGameStore((s) => s.gameStatus);

  const isDisabled = gameStatus !== 'battle';

  return (
    <button
      className="ton-button"
      onClick={executeTap}
      disabled={isDisabled}
    >
      トン！
    </button>
  );
}
```

---

## パフォーマンス最適化

### バンドルサイズ最適化

**目標**: 1.5MB以下

**達成方法**：
- ✅ 物理エンジンライブラリ不使用（~700KB削減）
- ✅ シンプルなカスタム物理演算（~100行 ≈ 5KB）
- ✅ Three.js + @react-three/fiber（~500KB）
- ✅ Zustand（~3KB）
- ✅ 基本ジオメトリのみ（GLTFモデル不使用）
- ✅ Tree-shaking有効

### メモリ管理

```typescript
// Vector3の再利用
const tempVector = new Vector3();

function normalize(vector: Vector3): Vector3 {
  tempVector.copy(vector);
  tempVector.normalize();
  return tempVector.clone();
}
```

### フレームレート維持

**目標**: 30fps以上（モバイル）

**最適化**：
- useFrame（60fps固定）
- React.memo（不要な再レンダリング防止）
- useMemo/useCallback（計算キャッシュ）
- シンプルなジオメトリ（低ポリゴン）
- 影なし（パフォーマンス優先）

```typescript
// React.memo最適化
export const TippingIndicator = React.memo(
  TippingIndicatorComponent,
  (prev, next) => {
    return prev.tipping === next.tipping;
  }
);
```

---

## 型定義

### ゲーム型

```typescript
// types/game.ts
export interface PhysicsState {
  position: Vector3;
  velocity: Vector3;
  angularVelocity: number;
  rotation: Euler;
  tipping: number;
  isFallen: boolean;
}

export type GameStatus = 'title' | 'battle' | 'result';

export type Winner = 'player' | 'opponent' | null;

export interface PhysicsConstants {
  GRAVITY: number;
  DAMPING: number;
  TAP_FORCE: number;
  TAP_BOUNCE: number;
  FALL_ANGLE: number;
  MIN_FALL_VELOCITY: number;
  RING_RADIUS: number;
}
```

---

## デバッグ機能

### 開発モードデバッグ表示

```typescript
// components/DebugOverlay.tsx
export function DebugOverlay() {
  if (!import.meta.env.DEV) return null;

  const player = useGameStore((s) => s.player);
  const opponent = useGameStore((s) => s.opponent);
  const tapRate = useGameStore((s) => s.tapTracker.getTapRate());

  return (
    <div className="debug-overlay">
      <div>Player Tipping: {(player.tipping * 100).toFixed(1)}%</div>
      <div>Opponent Tipping: {(opponent.tipping * 100).toFixed(1)}%</div>
      <div>Tap Rate: {tapRate} taps/sec</div>
      <div>Player Pos: ({player.position.x.toFixed(2)}, {player.position.z.toFixed(2)})</div>
      <div>Opponent Pos: ({opponent.position.x.toFixed(2)}, {opponent.position.z.toFixed(2)})</div>
    </div>
  );
}
```

### パフォーマンスモニター

```typescript
// utils/PerformanceMonitor.ts
export class PerformanceMonitor {
  private frames = 0;
  private lastTime = performance.now();

  update(): void {
    this.frames++;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      const fps = Math.round(
        (this.frames * 1000) / (currentTime - this.lastTime)
      );

      if (import.meta.env.DEV) {
        console.log(`FPS: ${fps}`);
      }

      this.frames = 0;
      this.lastTime = currentTime;
    }
  }
}
```

---

## テスト戦略

### ユニットテスト

**物理エンジンのテスト**：

```typescript
import { updateActorPhysics, applyTapForce } from '../physics/tontonzumo-physics';

describe('Physics Engine', () => {
  it('should apply gravity', () => {
    const actor: PhysicsState = {
      position: new Vector3(0, 1, 0),
      velocity: new Vector3(0, 0, 0),
      angularVelocity: 0,
      rotation: new Euler(0, 0, 0),
      tipping: 0,
      isFallen: false,
    };

    const deltaTime = 1 / 60; // 1フレーム
    const updated = updateActorPhysics(actor, deltaTime);

    // 重力で速度が減少
    expect(updated.velocity.y).toBeLessThan(0);
  });

  it('should apply tap force', () => {
    const actor: PhysicsState = {
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      angularVelocity: 0,
      rotation: new Euler(0, 0, 0),
      tipping: 0,
      isFallen: false,
    };

    applyTapForce(actor, 10); // 10 taps/sec

    // Z方向（前方）に力が加わる
    expect(actor.velocity.z).toBeGreaterThan(0);

    // Y方向（上方）にも跳ねる
    expect(actor.velocity.y).toBeGreaterThan(0);
  });

  it('should detect tipping', () => {
    const actor: PhysicsState = {
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      angularVelocity: 0,
      rotation: new Euler(Math.PI / 2, 0, 0), // 90°傾き
      tipping: 0,
      isFallen: false,
    };

    const updated = updateActorPhysics(actor, 1 / 60);

    // 傾き度が1.0以上（60°以上）
    expect(updated.tipping).toBeGreaterThan(1.0);
  });
});
```

### 統合テスト

**ゲームフロー全体のテスト**：

```typescript
describe('Game Flow', () => {
  it('should detect tipping victory', () => {
    const { result } = renderHook(() => useGameStore());

    // 相手を60°以上傾ける
    act(() => {
      result.current.opponent.rotation.x = Math.PI / 2; // 90°
      result.current.checkVictory();
    });

    expect(result.current.winner).toBe('player');
    expect(result.current.gameStatus).toBe('result');
  });

  it('should detect ring out victory', () => {
    const { result } = renderHook(() => useGameStore());

    // 相手を土俵外に押し出す
    act(() => {
      result.current.opponent.position.set(10, 0, 0);
      result.current.checkVictory();
    });

    expect(result.current.winner).toBe('player');
    expect(result.current.gameStatus).toBe('result');
  });
});
```

---

## セキュリティ考慮事項

### クライアントサイド実行

完全にクライアントサイドで実行：
- サーバー不要
- localStorageで設定保存のみ
- 機密情報なし

---

## 開発環境

### 必要なツール

- Node.js 18以上
- TypeScript 5.0以上
- Vite 5.0以上
- React 18以上
- Three.js r150以上
- Zustand 4.0以上

### ビルド設定

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 本番ビルドでconsoleを削除
      },
    },
  },
});
```

### 依存関係

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.150.0",
    "@react-three/fiber": "^8.0.0",
    "@react-three/drei": "^9.0.0",
    "zustand": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.17",
    "@types/three": "^0.150.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.7",
    "@vitejs/plugin-react": "^4.3.4"
  }
}
```

---

## アーキテクチャ図

### システム構成

```
┌─────────────────────────────────────────┐
│            React UI Layer               │
│  ┌──────────┐  ┌──────────┐            │
│  │   HUD    │  │トンボタン│            │
│  └──────────┘  └──────────┘            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│       Zustand State Management          │
│  ┌──────────────────────────────────┐   │
│  │ PhysicsState (位置・速度・傾き)  │   │
│  └──────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│         Physics Engine (~100行)         │
│  ┌──────────┐  ┌──────────┐            │
│  │重力・慣性│  │傾き計算  │            │
│  └──────────┘  └──────────┘            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│      React Three Fiber (3D Scene)       │
│  ┌──────────┐  ┌──────────┐            │
│  │  Player  │  │ Opponent │  ┌────┐   │
│  │(Capsule) │  │(Capsule) │  │Ring│   │
│  └──────────┘  └──────────┘  └────┘   │
└─────────────────────────────────────────┘
```

### データフロー

```
User Input (トンボタンClick)
    ↓
executeTap() - Zustand action
    ↓
tapTracker.addTap() - タップ記録
    ↓
applyTapForce() - 物理エンジンに力を加える
    ↓
updatePhysics() - 固定タイムステップで物理更新
    ├→ 重力適用
    ├→ 速度更新
    ├→ 位置更新
    ├→ 減衰
    └→ 傾き計算
        ↓
checkVictory() - 勝敗判定
    ├→ 転倒判定（60°以上）
    └→ 土俵外判定（4.5 units以上）
        ↓
React Re-render (HUD, 3D Scene)
    ↓
Three.js Rendering
```

---

## 参考資料

**React Three Fiber**：
- [Official Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)

**Zustand**：
- [Official Documentation](https://docs.pmnd.rs/zustand)

**Three.js**：
- [Three.js Documentation](https://threejs.org/docs/)

**物理シミュレーション**：
- [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)
- [Game Physics Engine Development](https://www.amazon.com/dp/0123819768)

**パフォーマンス**：
- [Web Performance Working Group](https://www.w3.org/webperf/)
