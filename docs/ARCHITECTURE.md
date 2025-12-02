# アーキテクチャ設計

レトロ風相撲バトルゲーム（MVP）のシステム設計とモジュール構造を説明します。

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
│  │   HUD    │  │ Controls  │  │Screens│ │
│  │ (レトロ)  │  │ (レトロ)   │  │(レトロ)│ │
│  └──────────┘  └───────────┘  └───────┘ │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│      State Management (Zustand)          │
│  - Player/AI actors                      │
│  - Gauge (0-100)                         │
│  - Cooldowns                             │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│         Game Systems                     │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │Movement  │  │ Actions  │  │  AI    │ │
│  │(座標計算) │  │(ダメージ)│  │        │ │
│  └──────────┘  └──────────┘  └────────┘ │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │  Gauge   │  │ Simple Collision     │ │
│  │(0-100)   │  │ (距離ベース判定)      │ │
│  └──────────┘  └──────────────────────┘ │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│       3D Scene (Three.js)                │
│  ┌────────────┐  ┌──────────────────┐   │
│  │   Actors   │  │   Environment    │   │
│  │(Sumo/Ring) │  │ (Camera/Lights)  │   │
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
- `Actor` - 力士の型
- `Action` - アクションの型（押す、つっぱり、スペシャル）
- `GameState` - ゲーム状態の型
- `ActionType` - アクション種類の列挙

**依存**: なし

```typescript
// MVPの簡易Actor型
interface Actor {
  id: string;
  position: Vector3;  // 3D座標
  hp: number;         // 現在HP
  maxHp: number;      // 最大HP
  state: ActorState;  // idle | attacking | damaged | defeated
}

// アクション種類
type ActionType = 'push' | 'tsuppari' | 'special';
```

**将来拡張** (Phase 3):
- `ActorStats` - ステータス（力、速さ、体力）
- `Rank` - 番付システム

### State Module (`src/state/`)

**責務**: グローバル状態管理

**エクスポート**:
- `useGameStore` - Zustandストアのフック
- State更新アクション

**依存**: `types/`

```typescript
// MVP ゲーム状態
interface GameState {
  player: Actor;           // プレイヤー力士
  opponent: Actor;         // AI力士
  gauge: number;           // スペシャルゲージ (0-100)
  cooldowns: Record<ActionType, number>;  // アクションクールダウン
  gameStatus: 'title' | 'battle' | 'result';  // 画面状態
  winner: 'player' | 'opponent' | null;  // 勝者
}
```

**将来拡張** (Phase 3):
- `rank: Rank` - 番付システム
- `winStreak: number` - 連勝数
- `trainingPoints: number` - 育成ポイント

### Game Systems Module (`src/game/systems/`)

**責務**: ゲームロジックとシステム

#### Movement System (`movement.ts`)

**責務**: 力士の移動とシンプルな座標計算

**インターフェース**:
```typescript
interface MovementSystem {
  updatePosition(actor: Actor, deltaTime: number): void;
  applyKnockback(actor: Actor, direction: Vector3, force: number): void;
  checkRingOut(actor: Actor, ringRadius: number): boolean;
}
```

**実装詳細**:
- 物理エンジン不使用、シンプルな座標計算
- 距離ベースの衝突判定（力士間距離 < 閾値）
- 土俵外判定: `position.length() > ringRadius`
- ノックバック: 方向ベクトル × 力の大きさ

#### Action System (`actions.ts`)

**責務**: アクション実行とクールダウン管理

**インターフェース**:
```typescript
interface ActionSystem {
  executeAction(actorId: string, action: ActionType): void;
  canExecute(actorId: string, actionType: ActionType): boolean;
  updateCooldowns(deltaTime: number): void;
}
```

**MVPアクション**:
- `push` - 押す（ダメージ + 小ノックバック、300msクールダウン）
- `tsuppari` - つっぱり（連続ダメージ、200msクールダウン）
- `special` - スペシャル技（大ダメージ + 大ノックバック、ゲージ100消費）

**ダメージ計算**:
```typescript
// シンプルな固定ダメージ
push: 10HP
tsuppari: 3HP
special: 30HP
```

#### Gauge System (`gauge.ts`)

**責務**: スペシャルゲージの管理

**実装**:
```typescript
// シンプルな数値管理（0-100）
let gauge = 0;

function addGauge(amount: number) {
  gauge = Math.min(100, gauge + amount);
}

function canUseSpecial(): boolean {
  return gauge >= 100;
}

function useSpecial(): boolean {
  if (gauge >= 100) {
    gauge = 0;
    return true;
  }
  return false;
}
```

**ゲージ増加条件**:
- 攻撃ヒット: +10
- 被弾: +5
- スペシャル技使用: gauge = 0

#### AI System (`ai.ts`)

**責務**: AI対戦相手の行動制御

**実装**:
```typescript
// シンプルな状態機械
- 距離が近い → push or tsuppari (ランダム)
- ゲージ満タン → special
- 距離が遠い → 接近
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

**MVP実装**:
- シンプルなBoxまたはCylinderジオメトリ
- アクター状態に応じた色変更:
  - idle: デフォルト色
  - attacking: 明るい色
  - damaged: 赤色フラッシュ
  - defeated: 暗い色

**レトロスタイル**:
- フラットシェーディング（ポリゴン感を出す）
- 基本色のみ、テクスチャ不使用

#### Ring Component (`Ring.tsx`)

**責務**: 土俵の3D表示

```typescript
function Ring(): JSX.Element
```

**MVP実装**:
- Cylinderジオメトリ（低い円柱）
- 外周ライン（別メッシュで強調）
- シンプルなマテリアル（茶色系）

### UI Module (`src/ui/`)

**責務**: レトロ風ユーザーインターフェース

#### HUD Components (`src/ui/hud/`)

**責務**: ゲーム情報の表示

**MVPコンポーネント**:
- `HPBar.tsx` - HPバー表示（プレイヤー/AI両方）
- `GaugeBar.tsx` - スペシャルゲージ表示（0-100%）
- `HUD.tsx` - 上記を統合したHUDコンポーネント

**レトロスタイル**:
- 8bitカラーパレット使用
- PixelMplusドット絵フォント
- シンプルな矩形バー
- CRT風スキャンライン効果（オプション）

#### Control Components (`src/ui/controls/`)

**責務**: タッチ操作ボタン

**MVPコンポーネント**:
- `ActionButtons.tsx` - 3つのアクションボタン群（押す、つっぱり、スペシャル）

```typescript
interface ActionButtonProps {
  actionType: ActionType;  // 'push' | 'tsuppari' | 'special'
  cooldown: number;        // 0-1 (cooldown進行度)
  disabled: boolean;       // ゲージ不足等でdisabled
  onPress: () => void;
}
```

**レトロボタンデザイン**:
- 大きなタッチターゲット（44×44px以上）
- 8bitカラーでクリック状態表現
- ドット絵フォントでラベル表示
- クールダウン時は暗くdisabled表示

#### Screen Components (`src/ui/screens/`)

**責務**: ゲーム画面遷移

**MVPコンポーネント**:
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
      <PerspectiveCamera position={[0, 10, 12]} />
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
- 俯瞰斜め視点: `position: [0, 10, 12]`
- ターゲット: 土俵中央 `[0, 0, 0]`
- 固定カメラ（MVP: 自動追従なし）

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

  --hp-green: #00ff00;      /* HP満タン */
  --hp-yellow: #ffff00;     /* HP中 */
  --hp-red: #ff0000;        /* HP低 */
  --gauge-blue: #00ffff;    /* ゲージ */
}
```

**レトロボタンスタイル**:
```css
.retro-button {
  font-family: 'PixelMplus', monospace;
  background: var(--retro-accent);
  border: 4px solid var(--retro-dark);
  color: var(--retro-bg);
  font-size: 24px;
  padding: 16px 32px;
  cursor: pointer;
}

.retro-button:active {
  background: var(--retro-dark);
  color: var(--retro-fg);
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

### アクション実行フロー（MVP）

```
User Touch Input
    ↓
ActionButton Component
    ↓
useGameStore Action
    ↓
Action System
    ├→ Cooldown Check (ok?)
    ├→ Execute Action
    │   ├→ Damage Calculation (固定値)
    │   └→ Knockback Direction + Force
    └→ Update Game State
        ↓
Movement System
    ├→ Apply Knockback (座標計算のみ)
    ├→ Distance-based Collision
    └→ Ring-out Check (distance > radius)
        ↓
Gauge System
    └→ Add Gauge (+10 hit, +5 damaged)
        ↓
UI Update (Zustand → React)
```

### レンダリングフロー（MVP）

```
Game Loop (requestAnimationFrame)
    ↓
Update Systems (deltaTime)
    ├→ Movement Update (座標更新)
    ├→ Cooldown Update (カウントダウン)
    ├→ AI Update (簡易状態機械)
    └→ Collision Check (距離ベース)
        ↓
Update Zustand Store
    ↓
React Re-render (Zustand購読)
    ├→ Three.js Scene Update (Sumo positions)
    ├→ HUD Update (HP/Gauge bars)
    └→ Button State Update (cooldown/disabled)
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

### シンプルな座標計算（物理エンジン不使用）

**選択理由**:
- MVPには物理エンジン不要
- バンドルサイズ削減（cannon-es ~200KB）
- シンプルな実装で十分
- デバッグ容易

**座標計算の実装**:
```typescript
// ノックバック
actor.position.add(direction.multiplyScalar(force * deltaTime));

// 衝突判定
const distance = player.position.distanceTo(opponent.position);
if (distance < threshold) { /* collision */ }

// 土俵外判定
if (actor.position.length() > ringRadius) { /* ring out */ }
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

## パフォーマンス最適化（MVP）

### レンダリング最適化

- デバイス解像度に応じた`dpr`設定（1-2）
- **シャドウなし**: 影を無効化（パフォーマンス優先）
- **基本ジオメトリのみ**: Box/Cylinderで頂点数最小化
- **フラットシェーディング**: レトロ感 + 計算軽量

### バンドル最適化

**目標**: 1.5MB以下

達成方法:
- **物理エンジン削除**: cannon-es (~200KB) 不使用
- **基本ジオメトリのみ**: GLTF モデル不使用
- **Tree-shaking**: Vite自動最適化
- **コード分割**: React.lazy（必要に応じて）
- **Vercel CDN**: 圧縮配信自動化

### メモリ管理

MVP では単純化:
- アクター数固定（プレイヤー + AI のみ）
- 基本ジオメトリ再利用
- テクスチャ不使用（色のみ）

## テスト戦略（MVP）

### ユニットテスト

**Game Systems**:
- `systems/movement.test.ts` - 座標計算、ノックバック、土俵外判定
- `systems/actions.test.ts` - ダメージ計算、クールダウン
- `systems/gauge.test.ts` - ゲージ増減、使用判定
- `systems/ai.test.ts` - AI行動選択ロジック

### 統合テスト

**ゲームフロー**:
- タイトル → バトル → リザルト画面遷移
- アクション実行とクールダウン動作
- ゲージ消費とスペシャル発動
- 勝敗判定（HP/Ring-out）

### E2Eテスト

**実機テスト**:
- iOS Safari, Android Chrome
- タッチ操作精度
- FPS測定（30fps以上維持）
- バンドルサイズ検証（1.5MB以下）

## セキュリティ考慮事項（MVP）

### クライアントサイドのみ

MVPでは完全にクライアントサイド実行:
- サーバー不要
- localStorage で設定保存のみ
- 機密情報なし

**将来拡張** (Phase 3+):
- オンライン対戦時: サーバー検証必須
- 育成システム時: 端末時刻改ざん対策

## 拡張性（Phase 3以降）

### 追加予定機能

**育成システム**:
- `types/ActorStats` - 力・速さ・体力
- `state/trainingState` - 育成ポイント、日次記録
- `ui/screens/TrainingScreen.tsx` - 育成UI

**番付システム**:
- `types/Rank` - 番付列挙
- `state/rankState` - 現在番付、連勝数
- `ui/hud/RankPanel.tsx` - 番付表示

**オンライン対戦**:
- WebSocketサーバー統合
- マッチメイキングシステム
- サーバーサイド検証

### モジュール追加パターン

**Bricks & Studs アプローチ**:
1. `types/` に新しいインターフェース定義（Studs）
2. `systems/` または `actors/` に実装（Bricks）
3. `state/` に状態追加
4. テスト作成
5. ドキュメント更新

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
