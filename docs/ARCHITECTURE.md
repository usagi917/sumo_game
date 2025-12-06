# アーキテクチャ設計

レトロ風紙相撲バトルゲームのシステム設計とモジュール構造を説明します。

## 設計原則

このプロジェクトは以下の原則に基づいて設計されています：

### Ruthless Simplicity（徹底的なシンプルさ）

- 最小限から始め、必要に応じて成長
- 将来の拡張性のための過剰設計を避ける
- 明確さを賢さより優先
- すべての抽象化はその存在を正当化する必要がある

### Modular Design（モジュラー設計）

- 自己完結型のモジュール（Bricks）
- 明確なインターフェース（Studs）
- 仕様から再生成可能
- 人間が設計し、AIが実装

## システム概要

```
┌──────────────────────────────────────────┐
│      User Interface (UI)                 │
│  ┌──────────┐  ┌───────────┐  ┌───────┐ │
│  │  HUD     │  │ Controls  │  │Screens│ │
│  │          │  │ (連打ボタン)│  │(レトロ)│ │
│  └──────────┘  └───────────┘  └───────┘ │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│      State Management (Zustand)          │
│  - Player/AI actors                      │
│  - Physics state (position, velocity)    │
│  - Tap tracking                          │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│         Game Systems                     │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Physics  │  │  Tapping │  │  AI    │ │
│  │  Engine  │  │  Tracker │  │        │ │
│  └──────────┘  └──────────┘  └────────┘ │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │ Tipping  │  │ Collision/Ring-out   │ │
│  │  System  │  │ (距離ベース判定)      │ │
│  └──────────┘  └──────────────────────┘ │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│       3D Scene (Three.js)                │
│  ┌────────────┐  ┌──────────────────┐   │
│  │   Actors   │  │   Environment    │   │
│  │(Capsules)  │  │ (Camera/Lights)  │   │
│  └────────────┘  └──────────────────┘   │
└──────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│         Styles (レトロデザイン)            │
│  - 8bitカラーパレット (retro.css)         │
│  - ドット絵フォント (PixelMplus)          │
└──────────────────────────────────────────┘
```

## モジュール構造

### Types Module (`src/types/`)

**責務**: すべてのモジュールで共有される型定義（Studs）

**エクスポート**:
- `PhysicsState` - 物理状態の型
- `TapButton` - タップボタンの型（強プッシュ/弱プッシュ）
- `GameState` - ゲーム状態の型

**依存**: なし

**主要インターフェース**:

- `PhysicsState`: 力士の物理状態（position, velocity, rotation, tipping等）
- 完全な定義: [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md#型定義) を参照

**主要型**:
type ActionType = 'ton' | 'tonton';

// アクター
interface Actor {
  id: string;
  physicsState: PhysicsState;
  isPlayer: boolean;
}
```

### State Module (`src/state/`)

**責務**: グローバル状態管理

**エクスポート**:
- `useGameStore` - Zustandストアのフック
- State更新アクション

**依存**: `types/`

**主要インターフェース**: `GameState` - ゲーム全体の状態管理

**主要フィールド**:
- `player`, `opponent`: 物理状態（PhysicsState）
- `gameStatus`: 画面状態（'title' | 'battle' | 'result'）
- `winner`: 勝者（'player' | 'opponent' | null）
- `tapTracker`: タップ追跡（TapTracker）

**完全な定義**: [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md#ゲーム状態管理) を参照

### Game Systems Module (`src/game/systems/`)

**責務**: ゲームロジックとシステム

#### Physics Engine (`physics.ts`)

**責務**: 物理シミュレーション（重力、慣性、摩擦）

**インターフェース**:
```typescript
interface PhysicsEngine {
  update(actor: PhysicsState, deltaTime: number): void;
  applyForce(actor: PhysicsState, force: THREE.Vector3): void;
  applyTapForce(actor: PhysicsState, button: TapButton, tapRate: number): void;
}
```

**物理パラメータ**:
```typescript
const PhysicsConfig = {
  gravity: new THREE.Vector3(0, -9.8, 0),
  friction: 0.7,
  airResistance: 0.95,
  actorMass: 1.0,
  tippingThreshold: Math.PI / 4,  // 45度
  stabilizationRate: 0.98,
  ringRadius: 4.5
};
```

**実装詳細**:
- 力の合成: `F = ma`
- 速度更新: `v = v + a*dt`
- 位置更新: `p = p + v*dt`
- 摩擦・空気抵抗による減衰
- カスタム実装（外部物理ライブラリ不使用）

#### Tap Tracking System (`tap-tracker.ts`)

**責務**: タップ速度の計測

**インターフェース**:
```typescript
class TapTracker {
  addTap(timestamp?: number): void;
  getTapRate(): number;  // タップ/秒
  clear(): void;
}
```

**実装詳細**:
- 1秒間のスライディングウィンドウ
- タイムスタンプ配列で管理
- 古いタップを自動削除

#### Tap Force Converter (`tap-force.ts`)

**責務**: タップ速度を力に変換

**インターフェース**:
```typescript
interface TapForceConverter {
  getForce(button: TapButton, tapRate: number): {
    force: number;
    tippingIncrease: number;
  };
}
```

**変換式**:
```typescript
// 強プッシュ
strongForce = 0.5 + (tapRate * 1.5);
strongTipping = tapRate * 0.01;

// 弱プッシュ
weakForce = 0.3 + (tapRate * 0.8);
weakTipping = tapRate * 0.003;
```

#### Tipping System (`tipping.ts`)

**責務**: 転倒判定

**インターフェース**:
```typescript
interface TippingSystem {
  update(actor: PhysicsState, deltaTime: number): void;
  checkFallen(actor: PhysicsState): boolean;
  getTippingDirection(actor: PhysicsState): 'forward' | 'backward' | null;
}
```

**判定条件**:
- 前傾: `rotation.x > 45°` → 前に倒れる
- 後傾: `rotation.x < -45°` → 後ろに倒れる
- 重心逸脱: 支持基底面外

#### Collision System (`collision.ts`)

**責務**: 衝突検出と土俵外判定

**インターフェース**:
```typescript
interface CollisionSystem {
  checkCollision(actor1: PhysicsState, actor2: PhysicsState): boolean;
  checkRingOut(actor: PhysicsState, ringRadius: number): boolean;
  resolveCollision(actor1: PhysicsState, actor2: PhysicsState): void;
}
```

**実装詳細**:
- 距離ベース衝突判定: `distance < threshold`
- 土俵外判定: `position.length() > ringRadius`
- 反発係数適用

#### AI System (`ai.ts`)

**責務**: AI対戦相手の行動制御

**主要クラス**: `AIEngine`

**AI特性**:
- ルールベース判断（距離、傾き状態に応じた行動選択）
- タップ速度の動的調整（4～15 taps/sec）
- ランダム性による人間らしさ

**実装詳細**: [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md#aiエンジン) を参照

#### Game Loop (`game-loop.ts`)

**責務**: 固定タイムステップゲームループ

**実装**:
```typescript
class GameLoop {
  private fixedDeltaTime = 1/60;  // 60fps物理更新
  private accumulator = 0;

  update(deltaTime: number): void {
    this.accumulator += deltaTime;

    // 固定タイムステップで物理更新
    while (this.accumulator >= this.fixedDeltaTime) {
      this.physicsEngine.update(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    // 可変タイムステップでレンダリング
    this.render();
  }
}
```

### Game Actors Module (`src/game/actors/`)

**責務**: 3Dアクターの表示

#### Sumo Component (`Sumo.tsx`)

**責務**: 力士の3D表示

```typescript
interface SumoProps {
  actor: Actor;
  isPlayer: boolean;
}

function Sumo({ actor, isPlayer }: SumoProps): JSX.Element
```

**実装**:
- Capsuleジオメトリ（カプセル型）
- 物理状態に連動した回転・位置
- 傾きに応じた色変更:
  - 安定: デフォルト色
  - 傾き中: 黄色系警告
  - 転倒危険: 赤色警告

**レトロスタイル**:
- フラットシェーディング（ポリゴン感）
- 基本色のみ、テクスチャ不使用

#### Ring Component (`Ring.tsx`)

**責務**: 土俵の3D表示

```typescript
function Ring(): JSX.Element
```

**実装**:
- Cylinderジオメトリ（低い円柱）
- 外周ライン（別メッシュで強調）
- シンプルなマテリアル（茶色系）

### UI Module (`src/ui/`)

**責務**: レトロ風ユーザーインターフェース

#### HUD Components (`src/ui/hud/`)

**責務**: ゲーム情報の表示

**コンポーネント**:
- `TippingIndicator.tsx` - 傾きインジケーター（0-100%）
- `HUD.tsx` - 統合HUDコンポーネント

**傾きインジケーター**:
```typescript
interface TippingIndicatorProps {
  tipping: number;  // 0-1（傾き度）
  isPlayer: boolean;
}
```

**レトロスタイル**:
- 8bitカラーパレット使用
- PixelMplusドット絵フォント
- 傾き度合いで色変化（緑 → 黄 → 赤）
- シンプルなバーまたはメーター表示

#### Control Components (`src/ui/controls/`)

**責務**: タッチ操作ボタン

**コンポーネント**:
- `TapButtons.tsx` - 2つのタップボタン群（強プッシュ、弱プッシュ）

```typescript
interface TapButtonProps {
  buttonType: TapButton;  // 'strong' | 'weak'
  onTap: () => void;
  disabled: boolean;
}
```

**ボタン仕様**:
- **強プッシュ**: 赤系色、「強」ラベル、高速前進・転倒リスク大
- **弱プッシュ**: 青系色、「弱」ラベル、安定前進・転倒リスク小

**レトロボタンデザイン**:
- 大きなタッチターゲット（80×80px以上）
- 8bitカラーで押下状態表現
- ドット絵フォントでラベル表示
- 連打しやすいUI配置

#### Screen Components (`src/ui/screens/`)

**責務**: ゲーム画面遷移

**コンポーネント**:
- `TitleScreen.tsx` - タイトル画面（試合開始ボタンのみ）
- `ResultScreen.tsx` - リザルト画面（勝敗表示、連続挑戦/タイトルへ）

**レトロ演出**:
- 8bitカラー背景
- PixelMplusフォント
- シンプルなアニメーション

### Game Scene (`src/game/GameScene.tsx`)

**責務**: 3Dシーン統合コンポーネント

**実装**:
```tsx
function GameScene() {
  return (
    <Canvas>
      <PerspectiveCamera position={[8, 8, 8]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />

      <Sumo actor={player} isPlayer={true} />
      <Sumo actor={opponent} isPlayer={false} />
      <Ring />
    </Canvas>
  );
}
```

**カメラ設定**:
- 俯瞰斜め視点: `position: [8, 8, 8]`
- ターゲット: 土俵中央 `[0, 0, 0]`
- 固定カメラ

**ライティング**:
- 環境光: 全体を明るく
- 平行光源: 影なし（パフォーマンス優先）

### Styles Module (`src/styles/`)

**責務**: レトロ風CSSスタイル

#### retro.css

**8bitカラーパレット**:
```css
:root {
  --retro-bg: #0f380f;      /* 濃い緑（ゲームボーイ風）*/
  --retro-fg: #9bbc0f;      /* 明るい緑 */
  --retro-accent: #8bac0f;  /* 中間緑 */
  --retro-dark: #306230;    /* 暗い緑 */

  --tipping-safe: #00ff00;    /* 傾き安全（緑） */
  --tipping-warning: #ffff00; /* 傾き警告（黄） */
  --tipping-danger: #ff0000;  /* 傾き危険（赤） */

  --strong-push: #ff4444;     /* 強プッシュ（赤系） */
  --weak-push: #4444ff;       /* 弱プッシュ（青系） */
}
```

**レトロボタンスタイル**:
```css
.tap-button {
  font-family: 'PixelMplus', monospace;
  border: 4px solid var(--retro-dark);
  color: var(--retro-bg);
  font-size: 32px;
  padding: 24px;
  cursor: pointer;
  min-width: 80px;
  min-height: 80px;
}

.tap-button.strong {
  background: var(--strong-push);
}

.tap-button.weak {
  background: var(--weak-push);
}

.tap-button:active {
  transform: scale(0.95);
  filter: brightness(0.8);
}
```

#### fonts.css

**PixelMplusフォント読み込み**:
```css
@font-face {
  font-family: 'PixelMplus';
  src: url('/fonts/PixelMplus12-Regular.ttf') format('truetype');
}

body {
  font-family: 'PixelMplus', monospace;
}
```

## データフロー

### タップ操作フロー

```
User Tap Input
    ↓
TapButton Component
    ↓
TapTracker.addTap()
    ↓
getTapRate() → tapRate/sec
    ↓
TapForceConverter
    ├→ Calculate force (baseForce + tapRate * multiplier)
    └→ Calculate tipping increase
        ↓
PhysicsEngine
    ├→ Apply force to actor
    ├→ Update velocity (F = ma)
    ├→ Update position (p = p + v*dt)
    ├→ Apply friction/air resistance
    └→ Update rotation/tipping
        ↓
TippingSystem
    └→ Check if fallen (rotation > 45°)
        ↓
CollisionSystem
    ├→ Check actor-actor collision
    └→ Check ring-out (distance > radius)
        ↓
Update Game State (Zustand)
    └→ Determine winner if fallen/ring-out
        ↓
UI Update (React)
```

### レンダリングフロー

```
Game Loop (requestAnimationFrame)
    ↓
Calculate deltaTime
    ↓
Fixed Timestep Physics Update (60fps)
    ├→ PhysicsEngine.update(fixedDeltaTime)
    ├→ TippingSystem.update(fixedDeltaTime)
    ├→ CollisionSystem.check()
    └→ AI.decide() → simulateTaps()
        ↓
Update Zustand Store
    ↓
React Re-render (Zustand購読)
    ├→ Three.js Scene Update
    │   ├→ Sumo positions (physics.position)
    │   └→ Sumo rotations (physics.rotation)
    ├→ HUD Update
    │   └→ TippingIndicator (physics.tipping)
    └→ Button State Update (disabled判定)
```

## 技術選択の理由

### Three.js + @react-three/fiber

**選択理由**:
- React統合がスムーズ
- 必要十分な3D機能
- 軽量（バンドルサイズ小）
- 学習リソース豊富

**代替案との比較**:
- Unity WebGL: ビルドサイズ大、パフォーマンス不安定
- Babylon.js: 高機能だがオーバースペック
- Phaser.js: 2D向け、3D要件を満たせない

### Zustand

**選択理由**:
- 最軽量の状態管理ライブラリ
- ボイラープレート最小
- TypeScript完全対応
- React統合シンプル

**代替案との比較**:
- Redux: 過剰な複雑さ
- Context API: パフォーマンス問題
- MobX: 学習コスト高

### カスタム物理エンジン（外部ライブラリ不使用）

**選択理由**:
- 複雑な物理演算は不要
- バンドルサイズ削減（cannon-es ~200KB, Rapier ~500KB節約）
- シンプルな実装で十分
- デバッグ容易
- 完全制御可能

**物理計算の実装**:
```typescript
// 力の適用
actor.forces.push(force);

// 速度更新（F = ma）
const netForce = sumForces(actor.forces);
const acceleration = netForce.divideScalar(actor.mass);
actor.velocity.add(acceleration.multiplyScalar(deltaTime));

// 摩擦・空気抵抗
actor.velocity.multiplyScalar(0.95);

// 位置更新
actor.position.add(actor.velocity.clone().multiplyScalar(deltaTime));

// 力をクリア
actor.forces = [];
```

### Vercel

**選択理由**:
- 静的サイトホスティング最適化
- グローバルCDN
- 自動ビルド最適化
- 無料枠で十分

**デプロイ設定**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

## パフォーマンス最適化

### レンダリング最適化

- デバイス解像度に応じた`dpr`設定（1-2）
- **シャドウなし**: 影を無効化（パフォーマンス優先）
- **基本ジオメトリのみ**: Capsuleで頂点数最小化
- **フラットシェーディング**: レトロ感 + 計算軽量

### バンドル最適化

**目標**: 1.5MB以下

達成方法:
- **物理エンジン削除**: cannon-es/Rapier不使用（~700KB節約）
- **基本ジオメトリのみ**: GLTFモデル不使用
- **Tree-shaking**: Vite自動最適化
- **コード分割**: React.lazy（必要に応じて）
- **Vercel CDN**: 圧縮配信自動化

### メモリ管理

メモリ管理の設計:
- アクター数固定（プレイヤー + AI のみ）
- 基本ジオメトリ再利用
- テクスチャ不使用（色のみ）

### 物理演算最適化

- 固定タイムステップ（60fps）で安定性確保
- シンプルな力の計算（F=ma）
- 距離ベース衝突判定（高速）
- 不要な計算スキップ（転倒後は物理更新停止）

## テスト戦略

### ユニットテスト

**Game Systems**:
- `systems/physics.test.ts` - 力の適用、速度/位置更新、摩擦
- `systems/tap-tracker.test.ts` - タップ計測、ウィンドウ管理
- `systems/tap-force.test.ts` - 力変換計算（強/弱）
- `systems/tipping.test.ts` - 転倒判定、閾値チェック
- `systems/collision.test.ts` - 衝突判定、土俵外判定
- `systems/ai.test.ts` - AI行動選択ロジック

### 統合テスト

**ゲームフロー**:
- タイトル → バトル → リザルト画面遷移
- タップ操作と力の適用
- 転倒による勝敗判定
- 土俵外による勝敗判定

### E2Eテスト

**実機テスト**:
- iOS Safari, Android Chrome
- タップ操作の精度と反応速度
- FPS測定（30fps以上維持）
- バンドルサイズ検証（1.5MB以下）

## セキュリティ考慮事項

### クライアントサイド実行

完全にクライアントサイドで実行:
- サーバー不要
- localStorage で設定保存のみ
- 機密情報なし

## 開発環境

### 必要なツール

- Node.js 18以上
- TypeScript 5.0以上
- Vite 5.0以上

### 推奨VSCode拡張機能

- ESLint
- Prettier
- TypeScript and JavaScript Language Features

## 参考資料

**ライブラリ**:
- [Three.js Documentation](https://threejs.org/docs/)
- [@react-three/fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Vite Documentation](https://vitejs.dev/)

**レトロデザイン**:
- [PixelMplus Font](https://itouhiro.hatenablog.com/entry/20130602/font) - ドット絵風日本語フォント
- 8bit Color Palette - ゲームボーイ風カラー

**デプロイ**:
- [Vercel Documentation](https://vercel.com/docs)
