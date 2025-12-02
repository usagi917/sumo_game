# アーキテクチャ設計

相撲バトルゲームのシステム設計とモジュール構造を説明します。

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
┌─────────────────────────────────────┐
│         User Interface (UI)         │
│  ┌─────────┐        ┌────────────┐ │
│  │   HUD   │        │  Controls  │ │
│  └─────────┘        └────────────┘ │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│       State Management (Zustand)    │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│          Game Systems               │
│  ┌──────────┐  ┌─────────────────┐ │
│  │ Physics  │  │ Action System   │ │
│  └──────────┘  └─────────────────┘ │
│  ┌──────────┐  ┌─────────────────┐ │
│  │  Gauge   │  │   Collision     │ │
│  └──────────┘  └─────────────────┘ │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│        3D Scene (Three.js)          │
│  ┌──────────┐  ┌─────────────────┐ │
│  │  Actors  │  │  Environment    │ │
│  └──────────┘  └─────────────────┘ │
└─────────────────────────────────────┘
```

## モジュール構造

### Types Module (`src/types/`)

**責務**: すべてのモジュールで共有される型定義（Studs）

**エクスポート**:
- `Actor` - 力士の型
- `ActorStats` - ステータス（力、速さ、体力）
- `Action` - アクションの型
- `GameState` - ゲーム状態の型

**依存**: なし

```typescript
// Actor型の例
interface Actor {
  id: string;
  position: Vector3;
  velocity: Vector3;
  hp: number;
  maxHp: number;
  stats: ActorStats;
  state: ActorState;
}
```

### State Module (`src/state/`)

**責務**: グローバル状態管理

**エクスポート**:
- `useGameStore` - Zustandストアのフック
- State更新アクション

**依存**: `types/`

```typescript
// ゲーム状態
interface GameState {
  currentRound: number;
  player: Actor;
  opponent: Actor;
  gauge: GaugeSystem;
  cooldowns: Record<string, number>;
}
```

### Game Systems Module (`src/game/systems/`)

**責務**: ゲームロジックとシステム

#### Physics System

**責務**: 物理演算と衝突判定

**インターフェース**:
```typescript
interface PhysicsSystem {
  update(deltaTime: number): void;
  applyForce(actorId: string, force: Vector3): void;
  checkCollision(actor1: Actor, actor2: Actor): boolean;
}
```

**実装詳細**:
- cannon-esを使用した軽量物理演算
- 力士のカプセル形状コライダー
- 土俵の円形境界判定

#### Action System

**責務**: アクション実行とクールダウン管理

**インターフェース**:
```typescript
interface ActionSystem {
  executeAction(actorId: string, action: Action): void;
  canExecute(actorId: string, actionType: Action['type']): boolean;
  updateCooldowns(deltaTime: number): void;
}
```

**アクション種類**:
- `push` - 押す（300msクールダウン）
- `tsuppari` - つっぱり（200msクールダウン）
- `special_a` - スペシャル技A（ゲージ消費）
- `special_b` - スペシャル技B（ゲージ消費）

#### Gauge System

**責務**: スペシャルゲージの管理

**インターフェース**:
```typescript
interface GaugeSystem {
  current: number; // 0-100
  addGauge(amount: number): void;
  consumeGauge(amount: number): boolean;
  canUseSpecial(): boolean;
}
```

**ゲージ増加条件**:
- 攻撃ヒット: +5
- 被弾: +3
- スペシャル技使用: -100

### Game Actors Module (`src/game/actors/`)

**責務**: 3Dアクターの表示とアニメーション

#### Sumo Component

**責務**: 力士の3Dモデルと表示

```typescript
interface SumoProps {
  actor: Actor;
  isPlayer: boolean;
}

function Sumo({ actor, isPlayer }: SumoProps): JSX.Element
```

**実装**:
- プレースホルダーボックスモデル（初期実装）
- 将来的にGLTFモデルに差し替え可能
- アクター状態に応じた色変更

#### Ring Component

**責務**: 土俵の3Dモデルと表示

```typescript
function Ring(): JSX.Element
```

**実装**:
- 円形の土俵メッシュ
- 外周ラインの強調表示
- 土俵外判定の境界可視化（デバッグモード）

### UI Module (`src/ui/`)

**責務**: ユーザーインターフェース

#### HUD Components (`src/ui/hud/`)

**責務**: ゲーム情報の表示

コンポーネント:
- `HPBar` - HPバー表示
- `GaugeBar` - スペシャルゲージ表示
- `RoundCounter` - ラウンド数表示
- `HUD` - 上記を統合したHUDコンポーネント

#### Control Components (`src/ui/controls/`)

**責務**: ユーザー入力

コンポーネント:
- `ActionButton` - 単一アクションボタン
- `ActionButtons` - 3つのアクションボタン群

```typescript
interface ActionButtonProps {
  actionType: Action['type'];
  cooldown: number;
  disabled: boolean;
  onPress: () => void;
}
```

#### Screen Components (`src/ui/screens/`)

**責務**: ゲーム画面

画面:
- `TitleScreen` - タイトル画面
- `ResultScreen` - リザルト画面

### Scene Module (`src/game/scene/`)

**責務**: 3Dシーンの設定

コンポーネント:
- `GameScene` - メインシーンコンポーネント
- `Camera` - カメラ制御
- `Lights` - ライティング設定

**カメラ設定**:
- 俯瞰斜め視点: `position: [0, 10, 12]`
- ターゲット: 土俵中央 `[0, 0, 0]`
- 自動ズーム調整（力士の距離に応じて）

## データフロー

### アクション実行フロー

```
User Input (Touch)
    ↓
ActionButton Component
    ↓
useGameStore Action
    ↓
Action System
    ├→ Cooldown Check
    ├→ Execute Action
    └→ Update Game State
        ↓
Physics System
    ├→ Apply Force
    ├→ Collision Detection
    └→ Update Actor Position
        ↓
Gauge System
    └→ Add/Consume Gauge
        ↓
UI Update (via Zustand)
```

### レンダリングフロー

```
Game Loop (requestAnimationFrame)
    ↓
Update Systems (deltaTime)
    ├→ Physics Update
    ├→ Cooldown Update
    ├→ AI Update
    └→ Collision Check
        ↓
Update Zustand Store
    ↓
React Re-render
    ├→ Three.js Scene Update
    ├→ HUD Update
    └→ Button State Update
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

### cannon-es

**選択理由**:
- 軽量物理エンジン
- 必要十分な機能
- Three.js統合容易

**物理演算の使用範囲**:
- 力士の移動と衝突
- ノックバック計算
- 土俵外判定

## パフォーマンス最適化

### レンダリング最適化

- デバイス解像度に応じた`dpr`設定（1-2）
- 低品質プリセット:
  - シャドウ無効化
  - ポストエフェクト削減
  - パーティクル簡略化

### バンドル最適化

- コード分割（React.lazy）
- Tree-shaking（Vite）
- アセット圧縮（GLTF: draco）

### メモリ管理

- アクター再利用（オブジェクトプール）
- テクスチャ解放
- 不要なイベントリスナー削除

## テスト戦略

### ユニットテスト

- `systems/physics.test.ts` - 物理演算ロジック
- `systems/gauge.test.ts` - ゲージ計算
- `systems/ring.test.ts` - 土俵判定

### 統合テスト

- ゲームフロー（タイトル→バトル→リザルト）
- アクション実行とクールダウン
- ゲージ消費とスペシャル発動

### E2Eテスト

- 実デバイスでのプレイテスト
- パフォーマンス測定
- ブラウザ互換性確認

## セキュリティ考慮事項

### クライアントサイドのみ

- 現在はローカル実行のみ
- 将来的なオンライン対戦時:
  - サーバー検証必須
  - クライアント信頼不可

### データ保存

- 設定をlocalStorageに保存
- 機密情報なし
- 端末時刻改ざんへの対策（育成システム実装時）

## 拡張性

### Phase 3での追加予定

- **育成システム**: 新しいstateモジュール追加
- **オンライン対戦**: WebSocketサーバー統合
- **追加スペシャル技**: Actionシステムに技追加

### モジュール追加パターン

1. `types/`に新しいインターフェース定義
2. `systems/`または`actors/`に実装
3. `state/`に状態追加（必要に応じて）
4. テスト作成

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

- [Three.js Documentation](https://threejs.org/docs/)
- [@react-three/fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [cannon-es Repository](https://github.com/pmndrs/cannon-es)
