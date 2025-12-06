# 相撲バトルゲーム

モバイル向けのレトロ風3D相撲バトルゲーム。シンプルなタッチ操作で楽しむ、短時間の白熱バトル。

## 特徴

- **レトロデザイン**: 8bitカラーパレット、ドット絵風フォント、懐かしいゲーム感
- **シンプル操作**: 連打ボタンで力士を動かす物理シミュレーション
- **短時間バトル**: 1ラウンド1〜2分の1本勝負
- **軽量設計**: 1.5MB以下のバンドルサイズ、Vercel最適化済み
- **快適動作**: 30fps以上（モバイル）、シンプルな3D描画

## クイックスタート

### 必要環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/usagi917/sumo_game.git
cd sumo_game

# 依存関係をインストール
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

### ビルド

```bash
npm run build
```

`dist/` ディレクトリにプロダクションビルドが生成されます。

## 操作方法

### バトル中の操作

- **トン！ボタン**: 連打することで力士に振動が伝わり前進
  - タップするたび前方への衝撃力が加わる
  - 重力と慣性による物理シミュレーション
  - 相手とぶつかり合いながら土俵外へ押し出す

### 勝利条件

以下のいずれかを満たすと勝利：

- 相手を土俵外に押し出す（土俵中心から4.5ユニット超）
- 相手を転倒させる（60度以上傾ける）

## ゲームの流れ

1. **タイトル画面** - 試合開始を選択
2. **バトル** - AI対戦で1本勝負（1ラウンド）
3. **リザルト** - 勝敗を表示
4. 連続挑戦またはタイトルへ戻る

```mermaid
flowchart TD
  T[タイトル画面] -->|試合開始| B[1本勝負<br/>AI対戦]
  B -->|勝利/敗北| RES[リザルト表示]
  RES -->|連続挑戦| B
  RES -->|タイトルへ| T
```

## 技術スタック

- **フロントエンド**: Vite + React + TypeScript
- **3Dレンダリング**: Three.js + @react-three/fiber（基本ジオメトリのみ使用）
- **状態管理**: Zustand
- **レトロスタイル**: CSS + ピクセルフォント（PixelMplus）
- **デプロイ**: Vercel（静的ビルド）

**設計方針**: 簡略化された物理シミュレーション（~100行の自作実装）、重力・慣性・減衰・転倒判定を含む

## プロジェクト構造

```
src/
├── types/             # 型定義（共有インターフェース）
│   └── index.ts       # Actor, ActionType, GameState
│
├── state/             # Zustand状態管理
│   └── store.ts       # グローバルゲームステート
│
├── game/              # ゲームロジック
│   ├── actors/        # 力士（Sumo.tsx）、土俵（Ring.tsx）
│   ├── systems/       # movement.ts, actions.ts, tontonzumo-physics.ts, ai.ts
│   └── GameScene.tsx  # 3Dシーン統合
│
├── ui/                # UIコンポーネント
│   ├── hud/           # HPBar、HUD
│   ├── controls/      # TontonControls
│   └── screens/       # TitleScreen、ResultScreen
│
└── styles/            # レトロスタイル
    ├── retro.css      # 8bitカラーパレット
    └── fonts.css      # ドット絵フォント
```

## 開発ガイド

### テスト実行

```bash
npm test
```

### 型チェック

```bash
npm run typecheck
```

### リント

```bash
npm run lint
```

## ドキュメント

- [技術設計](docs/TECHNICAL_DESIGN.md) - システムアーキテクチャと実装詳細
- [ゲームデザイン](docs/GAME_DESIGN.md) - ゲームメカニクスと仕様
- [操作仕様](docs/CONTROLS.md) - 入力システムと操作詳細

## パフォーマンス

- **目標FPS**: 30fps以上（モバイル）
- **初回ロード**: 3秒以内（Wi-Fi環境）
- **バンドルサイズ**: 1.5MB以下（物理エンジン削除により軽量化）

## ブラウザ対応

- iOS Safari 15以上
- Android Chrome 90以上
- デスクトップChrome、Firefox最新版

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。
