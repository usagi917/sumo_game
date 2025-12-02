# 実装タスクリスト（M1-M2 スコープ）

**このタスクリストはM1-M2フェーズ（コアバトル + スペシャル技）に絞っています。**
**育成システムやチュートリアルはPhase 3以降で実装予定です。**

---

## Phase 0: プロジェクトセットアップ

### リポジトリ初期化

- [ ] Viteプロジェクト作成
  ```bash
  npm create vite@latest . -- --template react-ts
  ```

- [ ] 依存関係インストール
  ```bash
  npm install three @react-three/fiber @react-three/drei zustand cannon-es
  ```

- [ ] 開発依存関係インストール
  ```bash
  npm install -D @types/three @types/cannon-es vitest @testing-library/react
  ```

- [ ] ESLint / Prettier 設定
  - [ ] `.eslintrc.cjs` を設定
  - [ ] `.prettierrc` を設定

### ディレクトリ構造

- [ ] `src/` 配下に以下を作成:
  ```
  src/
  ├── types/           # 型定義（studs）
  ├── state/           # 状態管理（Zustand）
  ├── game/
  │   ├── systems/     # 物理、アクション、ゲージ
  │   ├── actors/      # Sumo、Ring
  │   └── scene/       # カメラ、ライト
  └── ui/
      ├── hud/         # HP、ゲージ表示
      ├── controls/    # アクションボタン
      └── screens/     # タイトル、リザルト
  ```

---

## Phase M1: コアバトルシステム

### M1-1: Types Module（型定義）

- [ ] `src/types/index.ts` 作成
  - [ ] `Actor` インターフェース定義
  - [ ] `ActorStats` インターフェース定義
  - [ ] `Action` 型定義
  - [ ] `GameState` インターフェース定義

**参考**: [docs/ARCHITECTURE.md - Types Module](./docs/ARCHITECTURE.md#types-module-srctypes)

### M1-2: State Module（状態管理）

- [ ] `src/state/store.ts` 作成
  - [ ] Zustandストア初期化
  - [ ] `player` ステート（Actor型）
  - [ ] `opponent` ステート（Actor型）
  - [ ] `cooldowns` ステート（Record<ActionType, number>）
  - [ ] `currentRound` ステート

**参考**: [docs/ARCHITECTURE.md - State Module](./docs/ARCHITECTURE.md#state-module-srcstate)

### M1-3: Game Scene（3Dシーン）

- [ ] `src/game/scene/GameScene.tsx` 作成
  - [ ] `<Canvas>` コンポーネント設定
  - [ ] カメラ位置: `[0, 10, 12]`
  - [ ] ターゲット: `[0, 0, 0]`

- [ ] `src/game/scene/Lights.tsx` 作成
  - [ ] 環境光（AmbientLight）
  - [ ] 平行光（DirectionalLight）
  - [ ] 影の設定（低負荷モード対応）

**参考**: [docs/ARCHITECTURE.md - Scene Module](./docs/ARCHITECTURE.md#scene-module-srcgamescene)

### M1-4: Ring（土俵）

- [ ] `src/game/actors/Ring.tsx` 作成
  - [ ] 円形メッシュ（半径4.5ユニット）
  - [ ] 外周ライン強調
  - [ ] デバッグ時の境界可視化

- [ ] `src/game/systems/ring.ts` 作成
  - [ ] 土俵外判定関数 `isOutOfRing(position)`
  - [ ] 境界距離計算

**参考**: [docs/GAME_DESIGN.md - 土俵システム](./docs/GAME_DESIGN.md#土俵システム)

### M1-5: Sumo Actor（力士）

- [ ] `src/game/actors/Sumo.tsx` 作成
  - [ ] プレースホルダーモデル（Box/Capsule）
  - [ ] Actor状態に応じた色変更
  - [ ] 将来のGLTFモデル差し替え対応

**参考**: [docs/ARCHITECTURE.md - Sumo Component](./docs/ARCHITECTURE.md#sumo-component)

### M1-6: Physics System（物理演算）

- [ ] `src/game/systems/physics.ts` 作成
  - [ ] cannon-esワールド初期化
  - [ ] 力士のカプセル形状コライダー
  - [ ] `applyForce(actorId, force)` 実装
  - [ ] `checkCollision(actor1, actor2)` 実装
  - [ ] `update(deltaTime)` 実装

**参考**: [docs/ARCHITECTURE.md - Physics System](./docs/ARCHITECTURE.md#physics-system)

### M1-7: Action System（アクションシステム）

- [ ] `src/game/systems/actions.ts` 作成
  - [ ] `executeAction(actorId, action)` 実装
  - [ ] `canExecute(actorId, actionType)` 実装
  - [ ] `updateCooldowns(deltaTime)` 実装
  - [ ] クールダウン管理（push: 300ms, tsuppari: 200ms）

**アクション種類**:
- `push`: ダメージ10、ノックバック2.0、射程2.0、CD 300ms
- `tsuppari`: ダメージ3、ノックバック0.3、射程1.5、CD 200ms

**参考**: [docs/GAME_DESIGN.md - アクションシステム](./docs/GAME_DESIGN.md#アクションシステム)

### M1-8: AI System（簡易AI）

- [ ] `src/game/systems/ai.ts` 作成
  - [ ] プレイヤーへの接近ロジック
  - [ ] 射程内での攻撃判定
  - [ ] ランダム行動選択

**参考**: [docs/GAME_DESIGN.md - AIシステム](./docs/GAME_DESIGN.md#aiシステム対戦相手)

### M1-9: UI - HUD

- [ ] `src/ui/hud/HPBar.tsx` 作成
  - [ ] HPバー表示（0-100）
  - [ ] 減少アニメーション

- [ ] `src/ui/hud/RoundCounter.tsx` 作成
  - [ ] ラウンド数表示（1/2/3）
  - [ ] 勝利マーク表示

- [ ] `src/ui/hud/HUD.tsx` 作成
  - [ ] 上記コンポーネント統合

**参考**: [docs/ARCHITECTURE.md - HUD Components](./docs/ARCHITECTURE.md#hud-components-srcuihud)

### M1-10: UI - Controls

- [ ] `src/ui/controls/ActionButton.tsx` 作成
  - [ ] ボタン表示（80×80px）
  - [ ] クールダウン円形プログレス
  - [ ] 無効状態表示
  - [ ] タップフィードバック

- [ ] `src/ui/controls/ActionButtons.tsx` 作成
  - [ ] 3つのボタン配置（押す、つっぱり、スペシャル）
  - [ ] アクション発火処理

**参考**: [docs/CONTROLS.md - アクションボタン](./docs/CONTROLS.md#アクションボタン)

### M1-11: Game Loop

- [ ] `src/game/GameLoop.tsx` 作成
  - [ ] `useFrame` でゲームループ実装
  - [ ] Physics更新
  - [ ] AI更新
  - [ ] Cooldown更新
  - [ ] 土俵外判定
  - [ ] HP判定

### M1-12: 画面遷移

- [ ] `src/ui/screens/TitleScreen.tsx` 作成
  - [ ] タイトル表示
  - [ ] 試合開始ボタン

- [ ] `src/ui/screens/ResultScreen.tsx` 作成
  - [ ] 勝敗表示
  - [ ] 各ラウンドの結果
  - [ ] タイトルに戻るボタン

---

## Phase M2: スペシャル技 + 演出

### M2-1: Gauge System（ゲージシステム）

- [ ] `src/game/systems/gauge.ts` 作成
  - [ ] ゲージ増加ロジック（攻撃ヒット: +5、被弾: +3）
  - [ ] ゲージ消費ロジック（スペシャル発動: -100）
  - [ ] `canUseSpecial()` 判定

**参考**: [docs/ARCHITECTURE.md - Gauge System](./docs/ARCHITECTURE.md#gauge-system)

### M2-2: Special Actions（スペシャル技）

- [ ] `src/game/systems/actions.ts` にスペシャル技追加
  - [ ] `special_a`: 強押し出し
    - ダメージ30、ノックバック5.0、溜め時間0.5秒
  - [ ] `special_b`: 連撃バースト
    - 総ダメージ15（3ヒット×5）、発動時間1.0秒

**参考**: [docs/GAME_DESIGN.md - スペシャル技](./docs/GAME_DESIGN.md#スペシャル技a-強押し出し)

### M2-3: Special Effects（演出）

- [ ] `src/game/systems/effects.ts` 作成
  - [ ] カメラズーム演出
  - [ ] スローモーション（0.3秒）
  - [ ] インパクトエフェクト
  - [ ] スタンエフェクト

**参考**: [docs/GAME_DESIGN.md - 演出](./docs/GAME_DESIGN.md#演出)

### M2-4: UI - Gauge Display

- [ ] `src/ui/hud/GaugeBar.tsx` 作成
  - [ ] ゲージバー表示（0-100）
  - [ ] 満タン時の光る演出
  - [ ] 増加アニメーション

### M2-5: UI - Button Polish

- [ ] `ActionButton.tsx` に追加機能
  - [ ] リップルエフェクト
  - [ ] 無効状態アニメーション
  - [ ] バイブレーション連携

**参考**: [docs/CONTROLS.md - 視覚フィードバック](./docs/CONTROLS.md#視覚フィードバック)

---

## Phase 共通: サウンド・最適化・テスト

### サウンド

- [ ] `src/audio/` ディレクトリ作成
  - [ ] 効果音プレースホルダー配置
  - [ ] `AudioManager.ts` 作成
  - [ ] ボタンタップ音
  - [ ] 攻撃ヒット音
  - [ ] スペシャル発動音
  - [ ] 土俵外落下音

- [ ] バイブレーション対応
  - [ ] Web Vibration API 実装
  - [ ] 設定でON/OFF切り替え

**参考**: [docs/CONTROLS.md - 触覚フィードバック](./docs/CONTROLS.md#触覚フィードバック)

### パフォーマンス最適化

- [ ] デバイス解像度対応
  - [ ] `dpr` を1-2に制限
  - [ ] 低品質プリセット実装（影OFF、エフェクト削減）

- [ ] アセット最適化
  - [ ] GLTF圧縮（draco）
  - [ ] テクスチャ最適化
  - [ ] コード分割（React.lazy）

**参考**: [docs/ARCHITECTURE.md - パフォーマンス最適化](./docs/ARCHITECTURE.md#パフォーマンス最適化)

### テスト

- [ ] 単体テスト（vitest）
  - [ ] `systems/physics.test.ts` - 物理演算ロジック
  - [ ] `systems/gauge.test.ts` - ゲージ計算
  - [ ] `systems/ring.test.ts` - 土俵判定

- [ ] 統合テスト
  - [ ] ゲームフロー（タイトル→バトル→リザルト）
  - [ ] アクション実行とクールダウン
  - [ ] ゲージ消費とスペシャル発動

- [ ] E2Eテスト（手動）
  - [ ] iOS Safari での動作確認
  - [ ] Android Chrome での動作確認
  - [ ] iPad Safari での動作確認
  - [ ] パフォーマンス計測（30fps以上維持）

**参考**: [docs/ARCHITECTURE.md - テスト戦略](./docs/ARCHITECTURE.md#テスト戦略)

### ビルド・デプロイ

- [ ] ビルド設定
  - [ ] `vite.config.ts` 最適化
  - [ ] バンドルサイズ確認（目標: 2MB以下）
  - [ ] ソースマップ設定

- [ ] デプロイ
  - [ ] GitHub Pages 設定
  - [ ] または Cloudflare Pages
  - [ ] デプロイ手順を README.md に記載

---

## Phase 3以降（将来実装）

以下は現在のスコープ外です。M1-M2完成後に実装を検討します。

### 育成システム（M3）

- ⏭️ `src/state/training.ts` 作成
  - 日次育成UI
  - ステータス成長（力・速さ・体力）
  - パラメータ反映
  - 日付管理システム

### チュートリアル（M4）

- ⏭️ `src/ui/tutorial/` ディレクトリ作成
  - 初回起動時のオンボーディング
  - 操作説明フロー
  - スキップ/再表示機能

### PWA対応（M4）

- ⏭️ manifest.json 作成
- ⏭️ Service Worker 実装
- ⏭️ オフライン動作対応
- ⏭️ ホーム画面追加機能

### オンライン対戦（M5）

- ⏭️ マッチメイキングシステム
- ⏭️ リアルタイム対戦
- ⏭️ ランキングシステム

---

## 進捗確認

**現在の進捗**: Phase 0（プロジェクトセットアップ）

**次のマイルストーン**: M1-1（Types Module作成）

---

## 参考ドキュメント

実装時は以下を参照してください：

- [README.md](./README.md) - プロジェクト概要
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - システム設計
- [docs/GAME_DESIGN.md](./docs/GAME_DESIGN.md) - ゲームメカニクス
- [docs/CONTROLS.md](./docs/CONTROLS.md) - 操作仕様
- [spec.md](./spec.md) - 要件定義
