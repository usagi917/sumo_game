# アーキテクチャ設計

レトロ風相撲バトルゲームのシステム設計とモジュール構造を説明します。

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
│  │(転倒率)  │  │ (トン！)  │  │(レトロ)│ │
│  │ +Rank    │  │           │  │ +Rank │ │
│  └──────────┘  └───────────┘  └───────┘ │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│      State Management (Zustand)          │
│  - Player/AI physics state               │
│  - TapTracker (タップレート測定)         │
│  - Game status                           │
│  - Ranking state (番付)                  │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│         Game Systems                     │
│  ┌──────────────┐  ┌────────────────┐   │
│  │   Physics    │  │   TapTracker   │   │
│  │   Engine     │  │   (1s window)  │   │
│  └──────────────┘  └────────────────┘   │
│  ┌──────────────┐  ┌────────────────┐   │
│  │      AI      │  │  Ring-out判定  │   │
│  │   (連打)     │  │   (距離ベース) │   │
│  └──────────────┘  └────────────────┘   │
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
│  - 8bitカラーパレット (index.css)         │
│  - M PLUS 1フォント                       │
└──────────────────────────────────────────┘
```

## モジュール構造

### Types Module (`src/types/`)

**責務**: すべてのモジュールで共有される型定義（Studs）

**エクスポート**:
- `PhysicsState` - 物理状態の型
- `GameState` - ゲーム状態の型
- `GameStatus` - ゲーム状態種別（'title' | 'battle' | 'result'）
- `Winner` - 勝者（'player' | 'opponent' | null）

**依存**: なし

**主要インターフェース**:

```typescript
// 物理状態（力士の状態）
interface PhysicsState {
  position: Vector3;        // 位置
  velocity: Vector3;        // 速度
  angularVelocity: number;  // 角速度
  rotation: Euler;          // 回転角度
  tipping: number;          // 傾き度（0-1）
  isFallen: boolean;        // 転倒フラグ
}

type GameStatus = 'title' | 'battle' | 'result';
type Winner = 'player' | 'opponent' | null;
```

### State Module (`src/state/`)

**責務**: グローバル状態管理

**エクスポート**:
- `useGameStore` - Zustandストアのフック
- `useRankingStore` - 番付ストアのフック
- State更新アクション（`executeTap`, `updatePhysics`, `checkVictory`等）

**依存**: `types/`, `systems/TapTracker`, `physics/tontonzumo-physics`

**主要インターフェース**:
- `GameState` - ゲーム全体の状態管理
- `RankingState` - 番付システムの状態管理

**主要フィールド**:
- `player`, `opponent`: 物理状態（`PhysicsState`）
- `gameStatus`: 画面状態（`GameStatus`）
- `winner`: 勝者（`Winner`）
- `tapTracker`: タップレート測定（`TapTracker`インスタンス）

```typescript
interface GameState {
  player: PhysicsState;
  opponent: PhysicsState;
  gameStatus: GameStatus;
  winner: Winner;
  tapTracker: TapTracker;

  // Actions
  executeTap: () => void;
  updatePhysics: (deltaTime: number) => void;
  checkVictory: () => void;
  startBattle: () => void;
  resetGame: () => void;
}
```

#### Ranking Store Module (`src/state/rankingStore.ts`)

**責務**: 番付（ランキング）システムの状態管理と永続化

**エクスポート**:
- `useRankingStore` - 番付ストアのフック
- `recordWin` - 勝利記録アクション
- `recordLoss` - 敗北記録アクション

**依存**: `types/`

**主要インターフェース**:

```typescript
type SumoRank = 0 | 1 | 2 | 3 | 4;
// 0: 前頭 (Maegashira) - 最低ランク
// 1: 小結 (Komusubi)
// 2: 関脇 (Sekiwake)
// 3: 大関 (Ozeki)
// 4: 横綱 (Yokozuna) - 最高位

interface RankingState {
  currentRank: SumoRank;         // 現在の階級（0-4）
  consecutiveWins: number;        // 連勝数（0-3）
  totalWins: number;              // 通算勝利数
  totalLosses: number;            // 通算敗北数

  // アクション
  recordWin: () => void;          // 勝利を記録し、昇進判定
  recordLoss: () => void;         // 敗北を記録し、降格判定
  getRankName: () => string;      // 現在の階級名を取得
  getWinsToPromotion: () => number; // 次の昇進まで必要な勝数
}

const RANK_NAMES = ['前頭', '小結', '関脇', '大関', '横綱'] as const;
const WINS_REQUIRED_FOR_PROMOTION = 3;
```

**実装詳細**:

**昇進ロジック** (`recordWin()`):
```typescript
recordWin: () => {
  const state = get();
  const newWins = state.consecutiveWins + 1;

  // 3連勝で昇進（横綱以外）
  if (newWins >= 3 && state.currentRank < 4) {
    set({
      currentRank: state.currentRank + 1,
      consecutiveWins: 0,  // リセット
      totalWins: state.totalWins + 1
    });
    // localStorage保存
    saveToLocalStorage();
  } else {
    set({
      consecutiveWins: newWins,
      totalWins: state.totalWins + 1
    });
    saveToLocalStorage();
  }
}
```

**降格ロジック** (`recordLoss()`):
```typescript
recordLoss: () => {
  const state = get();

  // 1敗で降格（前頭と横綱以外）
  if (state.currentRank > 0 && state.currentRank < 4) {
    set({
      currentRank: state.currentRank - 1,
      consecutiveWins: 0,  // リセット
      totalLosses: state.totalLosses + 1
    });
    saveToLocalStorage();
  } else {
    // 前頭または横綱: 降格なし
    set({
      consecutiveWins: 0,  // リセット
      totalLosses: state.totalLosses + 1
    });
    saveToLocalStorage();
  }
}
```

**永続化**:
```typescript
const STORAGE_KEY = 'sumoRanking';

// 保存
const saveToLocalStorage = () => {
  const state = get();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentRank: state.currentRank,
    consecutiveWins: state.consecutiveWins,
    totalWins: state.totalWins,
    totalLosses: state.totalLosses
  }));
};

// 読み込み
const loadFromLocalStorage = (): Partial<RankingState> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // デフォルト値（前頭でスタート）
  return {
    currentRank: 0,
    consecutiveWins: 0,
    totalWins: 0,
    totalLosses: 0
  };
};
```

**ゲームストアとの統合**:

リザルト画面で勝敗が決定したタイミングで呼び出し:
```typescript
// ResultScreen.tsx
const { winner } = useGameStore();
const { recordWin, recordLoss } = useRankingStore();

useEffect(() => {
  if (winner === 'player') {
    recordWin();
  } else if (winner === 'opponent') {
    recordLoss();
  }
}, [winner]);
```

### Physics Module (`src/physics/`)

**責務**: 物理シミュレーション

#### Physics Engine (`tontonzumo-physics.ts`)

**責務**: カスタム物理エンジン（約100行）

**エクスポート関数**:
```typescript
// 物理更新
function updatePhysics(actor: PhysicsState, deltaTime: number): PhysicsState

// タップ力の適用
function applyTapForce(actor: PhysicsState, tapRate: number): PhysicsState

// 土俵外判定
function isRingOut(position: Vector3): boolean
```

**物理定数**:
```typescript
const PHYSICS_CONSTANTS = {
  GRAVITY: 9.8,              // 重力加速度
  DAMPING: 0.95,             // 速度減衰率
  ANGULAR_DAMPING: 0.90,     // 角速度減衰率
  TAP_FORCE: 0.3,            // タップ1回あたりの押す力
  TAP_BOUNCE: 0.2,           // タップ1回あたりの跳ね返り
  FALL_ANGLE: 0.6,           // 転倒判定角度（ラジアン）
  RING_RADIUS: 4.5           // 土俵半径
};
```

**実装詳細**:
1. 重力適用（`velocity.y -= GRAVITY * deltaTime`）
2. 速度減衰（`velocity *= DAMPING`）
3. 位置更新（`position += velocity * deltaTime`）
4. 回転更新（`rotation.x += angularVelocity * deltaTime`）
5. 地面衝突処理（`if (position.y < 0)` → 反発）
6. 傾き度計算（`tipping = |rotation.x| / FALL_ANGLE`）
7. 転倒判定（`isFallen = tipping >= 1.0`）

### Systems Module (`src/systems/`)

**責務**: ゲームシステム

#### TapTracker (`tap-tracker.ts`)

**責務**: タップレート測定（1秒間のスライディングウィンドウ）

**インターフェース**:
```typescript
class TapTracker {
  private tapTimestamps: number[] = [];
  private readonly windowDuration = 1000; // 1秒

  addTap(timestamp?: number): void;
  getTapRate(): number;
  reset(): void;
  private cleanup(now: number): void;
}
```

**実装詳細**:
- `addTap()`: 現在時刻をタイムスタンプ配列に追加
- `getTapRate()`: 1秒以内のタップ数を返す
- `cleanup()`: 1秒より古いタイムスタンプを削除
- スライディングウィンドウで正確なタップレート測定

#### AI System

**責務**: AI対戦相手の行動制御（gameStore.tsに統合）

**AI特性**:
- シンプルな連打アルゴリズム
- ランダム性による自然な挙動
- 距離ベース判断（オプション）

**アクション選択ロジック**:
```typescript
// gameStore.tsのupdatePhysics内で実装
if (gameStatus === 'battle') {
  // AI is simple: just tap randomly
  if (Math.random() < 0.6) { // 60% chance to tap each frame
    const aiTapRate = 3 + Math.random() * 2; // 3-5 taps/sec
    newState.opponent = applyTapForce(newState.opponent, aiTapRate);
  }
}
```

**実装の単純化**:
- 専用AIエンジンなし
- gameStore内で直接実装
- 物理エンジンがAIの動きも制御

#### Game Loop (Three.js `useFrame`)

**責務**: フレームごとの更新

**実装**:
```typescript
useFrame((state, delta) => {
  const { updatePhysics, checkVictory, gameStatus } = useGameStore.getState();

  if (gameStatus === 'battle') {
    // 物理更新（プレイヤー + AI）
    updatePhysics(delta);

    // 勝敗判定
    checkVictory();
  }
});
```

**実装の単純性**:
- Three.jsの`useFrame`が自動的にrequestAnimationFrameで実行
- 複雑な固定タイムステップは不要
- deltaTimeをそのまま物理エンジンに渡す
- 勝敗判定は毎フレーム実行（軽量な距離計算のみ）

---

## 3Dコンポーネント (`src/components/game/`)

### Game Actors Module

**責務**: 3Dアクターの表示

#### Sumo Component (`Sumo.tsx`)

**責務**: 力士の3D表示

```typescript
interface SumoProps {
  physicsState: PhysicsState;
  isPlayer: boolean;
}

function Sumo({ physicsState, isPlayer }: SumoProps): JSX.Element
```

**実装**:
- Capsuleジオメトリ（カプセル型）
- 位置・回転の同期（physicsState.position, physicsState.rotation）
- 転倒度に応じた色変更:
  - tipping < 0.5: デフォルト色（青/赤）
  - tipping 0.5-0.8: 黄色系警告
  - tipping > 0.8: 赤色系危険

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
- Torusジオメトリ（土俵の縁）
- シンプルなマテリアル（茶色系 + ゴールド縁）

**サイズ**:
- 半径: 4.5ユニット
- 高さ: 0.2ユニット

---

## UIコンポーネント (`src/components/ui/`)

### HUD Components

**責務**: ゲーム情報の表示

**コンポーネント**:
- `TippingGauge.tsx` - 転倒ゲージ（プレイヤー/AI）
- `HUD.tsx` - 統合HUDコンポーネント

**転倒ゲージ**:
```typescript
interface TippingGaugeProps {
  tipping: number;   // 0.0-1.0（1.0で転倒）
  isPlayer: boolean;
}
```

**実装**:
- 傾き度を視覚化（0% → 100%）
- 色変化:
  - 0-50%: 緑（安全）
  - 50-80%: 黄（警告）
  - 80-100%: 赤（危険）
- 100%到達で転倒判定

**レトロスタイル**:
- 8bitカラーパレット使用
- M PLUS 1フォント
- シンプルな横バー表示

### Control Components

**責務**: タッチ操作ボタン

**コンポーネント**:
- `TappingButton.tsx` - 連打用ボタン（トン！）

```typescript
interface TappingButtonProps {
  onTap: () => void;
  tapRate: number;  // 現在のタップレート（表示用）
}
```

**ボタン仕様**:
- **サイズ**: 最低100×100px（連打しやすい大きさ）
- **配置**: 画面中央下部（親指が届きやすい位置）
- **フィードバック**: タップ時にアニメーション + タップレート表示

**レトロボタンデザイン**:
- 大きなタッチターゲット（100×100px以上）
- 8bitカラーで押下状態表現
- 「トン！」ラベル（M PLUS 1フォント）
- タップレート表示（例: "5 taps/s"）

#### Screen Components (`src/ui/screens/`)

**責務**: ゲーム画面遷移

**コンポーネント**:
- `TitleScreen.tsx` - タイトル画面（試合開始ボタンのみ）
- `ResultScreen.tsx` - リザルト画面（勝敗表示、連続挑戦/タイトルへ）

**レトロ演出**:
- 8bitカラー背景
- M PLUS 1フォント
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
  --retro-bg: #3d2817;      /* 土俵の土色 */
  --retro-fg: #f4e4c1;      /* まわしのクリーム色 */
  --retro-accent: #8b4513;  /* 茶色まわし */
  --retro-dark: #1a0f08;    /* 深い土色 */

  --tipping-safe: #00ff00;     /* 転倒度低（緑） */
  --tipping-warning: #ffff00;  /* 転倒度中（黄） */
  --tipping-danger: #ff0000;   /* 転倒度高（赤） */

  --tap-button: #ffd700;       /* トン！ボタン（ゴールド） */
}
```

**レトロボタンスタイル**:
```css
.tapping-button {
  font-family: 'M PLUS 1', monospace;
  border: 4px solid var(--retro-dark);
  background: var(--tap-button);
  color: var(--retro-bg);
  font-size: 48px;
  font-weight: bold;
  padding: 32px;
  cursor: pointer;
  min-width: 100px;
  min-height: 100px;
  border-radius: 50%;
  user-select: none;
}

.tapping-button:active {
  transform: scale(0.9);
  filter: brightness(0.8);
}

.tap-rate-display {
  font-family: 'M PLUS 1', monospace;
  font-size: 18px;
  color: var(--retro-fg);
  text-align: center;
  margin-top: 8px;
}
```

#### fonts.css

**M PLUS 1フォント読み込み**:
```css
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@400;700&display=swap');

body {
  font-family: 'M PLUS 1', monospace;
}
```

---

## データフロー

### タップ実行フロー

```
User Tap
    ↓
TappingButton Component
    ↓
tapTracker.addTap(timestamp)
    ↓
gameStore.executeTap()
    ├→ tapRate = tapTracker.getTapRate()
    ├→ applyTapForce(player, tapRate)
    │   ├→ Apply forward force (TAP_FORCE × tapRate)
    │   ├→ Apply bounce (TAP_BOUNCE × tapRate)
    │   └→ Apply random angular velocity
    └→ Update player physics state
        ↓
UI Update (React)
    └→ Display new tapRate
```

### 物理更新フロー（毎フレーム）

```
useFrame(delta)
    ↓
gameStore.updatePhysics(delta)
    ├→ updatePhysics(player, delta)
    │   ├→ Apply gravity
    │   ├→ Apply damping
    │   ├→ Update position
    │   ├→ Update rotation
    │   ├→ Ground collision
    │   └→ Calculate tipping
    │
    ├→ updatePhysics(opponent, delta)
    │   └→ (same as player)
    │
    ├→ AI tap decision (random)
    │   └→ applyTapForce(opponent, aiTapRate)
    │
    └→ Check victory conditions
        ├→ player.isFallen? → opponent wins
        ├→ opponent.isFallen? → player wins
        ├→ isRingOut(player.position)? → opponent wins
        └→ isRingOut(opponent.position)? → player wins
            ↓
React Re-render (Zustand subscription)
    ├→ Three.js Scene Update
    │   ├→ Sumo positions
    │   └→ Sumo rotations
    └→ HUD Update
        ├→ TippingGauge (player.tipping, opponent.tipping)
        └→ TapRate display
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
- ゲームに必要な物理は限定的（重力、減衰、回転のみ）
- バンドルサイズ削減（cannon-es等は不要）
- ~100行で実装可能
- デバッグ容易
- 完全制御可能

**物理計算の実装**:
```typescript
// 重力適用
newState.velocity.y -= PHYSICS_CONSTANTS.GRAVITY * deltaTime;

// 減衰適用
newState.velocity.multiplyScalar(PHYSICS_CONSTANTS.DAMPING);
newState.angularVelocity *= PHYSICS_CONSTANTS.ANGULAR_DAMPING;

// 位置更新
newState.position.add(newState.velocity.clone().multiplyScalar(deltaTime));

// 回転更新
newState.rotation.x += newState.angularVelocity * deltaTime;

// 地面衝突
if (newState.position.y < 0) {
  newState.position.y = 0;
  newState.velocity.y *= -0.3; // Bounce
}

// 転倒判定
newState.tipping = Math.abs(newState.rotation.x) / PHYSICS_CONSTANTS.FALL_ANGLE;
newState.isFallen = newState.tipping >= 1.0;
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
- **カスタム物理エンジン**: cannon-es不使用（~700KB節約）
- **基本ジオメトリのみ**: GLTFモデル不使用
- **Tree-shaking**: Vite自動最適化
- **コード分割**: React.lazy（必要に応じて）
- **Vercel CDN**: 圧縮配信自動化

### メモリ管理

メモリ管理の設計:
- アクター数固定（プレイヤー + AI のみ）
- 基本ジオメトリ再利用
- テクスチャ不使用（色のみ）
- 物理状態はシンプルなオブジェクト

### ゲームループ最適化

- Three.js `useFrame`による自動最適化
- シンプルな物理計算（重力、減衰、回転のみ）
- 距離ベース判定（高速）
- 勝敗決定後は更新停止

---

## テスト戦略

### ユニットテスト

**Physics Engine**:
- `physics/tontonzumo-physics.test.ts` - 重力、減衰、衝突、転倒判定
- `systems/tap-tracker.test.ts` - タップレート測定、スライディングウィンドウ

**Test Cases**:
```typescript
describe('Physics Engine', () => {
  test('重力が正しく適用される', () => {
    const state = updatePhysics(initialState, 1.0);
    expect(state.velocity.y).toBeLessThan(0);
  });

  test('転倒判定が正確', () => {
    const state = { rotation: { x: 0.7 }, ... };
    expect(state.isFallen).toBe(true); // 0.7 > FALL_ANGLE(0.6)
  });

  test('土俵外判定が正確', () => {
    const position = new Vector3(5, 0, 0);
    expect(isRingOut(position)).toBe(true); // 5 > 4.5
  });
});

describe('TapTracker', () => {
  test('1秒間のタップ数を正確に測定', () => {
    const tracker = new TapTracker();
    tracker.addTap(0);
    tracker.addTap(200);
    tracker.addTap(500);
    expect(tracker.getTapRate()).toBe(3);
  });

  test('古いタップを自動削除', () => {
    const tracker = new TapTracker();
    tracker.addTap(0);
    tracker.addTap(1200); // 1秒後
    expect(tracker.getTapRate()).toBe(1); // 最初のタップは削除済み
  });
});
```

### 統合テスト

**ゲームフロー**:
- タイトル → バトル → リザルト画面遷移
- タップ操作と物理シミュレーション
- 転倒による勝敗判定
- 土俵外による勝敗判定

### E2Eテスト

**実機テスト**:
- iOS Safari, Android Chrome
- タップ操作の反応速度（連打しやすさ）
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
- [M PLUS 1 Font](https://fonts.google.com/specimen/M+PLUS+1) - 日本語対応レトロ風フォント
- 8bit Color Palette - レトロゲーム風カラー

**デプロイ**:
- [Vercel Documentation](https://vercel.com/docs)
