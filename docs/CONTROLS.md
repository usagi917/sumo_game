# 操作システム仕様

レトロ風相撲バトルゲームの操作システムとUIインタラクションを説明します。

## 設計原則

### モバイルファースト

- タッチ操作専用設計
- 大型タップボタン（最低100×100px）
- 最小タッチターゲット: 100×100px
- 連打しやすい配置と形状

### シンプルな連打システム

- **1つの大きなボタン**のみ（「トン！」）
- 連打すればするほど強い力で押せる
- タップレート（1秒あたりのタップ数）を測定
- 物理エンジンが自動的に挙動を決定

---

## 入力システム

### タップボタンシステム

```typescript
interface TappingButtonProps {
  onTap: () => void;
  tapRate: number;  // 現在のタップレート（表示用）
}
```

**イベントフロー**:

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
Physics Engine (毎フレーム)
    ├→ Apply gravity
    ├→ Apply damping
    ├→ Update position/rotation
    ├→ Check tipping (転倒判定)
    └→ Check ring-out (土俵外判定)
        ↓
UI Update (React)
    ├→ Display new tapRate
    └→ Display tipping gauge
```

### タップ処理フロー

```typescript
// TappingButton.tsx から
function handleTap() {
  // ゲーム停止中は実行しない
  if (gameState !== 'battle') return;

  // タップを記録
  tapTracker.addTap();

  // タップ力を適用
  executeTap();

  // 視覚フィードバック
  playTapAnimation();

  // サウンド/触覚フィードバック（optional）
  playTapSound();
  vibrate(10);
}
```

---

## トン！ボタン

### ボタン仕様（レトロスタイル）

**中央大型ボタン**:

- **ラベル**: 「トン！」（M PLUS 1フォント、48px、太字）
- **色**: #ffd700（ゴールド）
- **配置**: 画面中央下部（親指が届きやすい位置）
- **サイズ**: 最低100×100px（連打しやすい大きさ）
- **形状**: 円形（border-radius: 50%）
- **動作**:
  - タップ1回あたり: TAP_FORCE (0.3) の前方向力
  - タップ1回あたり: TAP_BOUNCE (0.2) の上向き跳ね返り
  - ランダムな横揺れ（角速度）
  - タップレートが高いほど強い力
- **表示**: 現在のタップレート（例: "5 taps/s"）

**レトロデザイン特徴**:
- 太い境界線（4px）
- M PLUS 1フォント使用（日本語対応、レトロ風）
- 大きなラベル（48px）
- タップ時に即座にスケール変化（0.9倍）

### ボタン配置

```
画面レイアウト:

┌────────────────────────┐
│  転倒ゲージ（両者）     │ ← HUD（転倒度表示）
├────────────────────────┤
│                        │
│      ゲーム画面         │
│     (3D土俵シーン)      │
│     力士が戦う          │
│                        │
│                        │
│        ┌──┐            │
│        │トン│           │ ← 大型タップボタン（中央下部）
│        │！│            │
│        └──┘            │
│     5 taps/s           │ ← タップレート表示
└────────────────────────┘
```

**配置仕様**:

- 画面下部に固定
- 中央配置（左右均等マージン）
- 親指が届く範囲（画面下から30%以内）
- サイズ: 最低100×100px
- 円形ボタン（連打しやすい）

### ボタンサイズ

```typescript
const tappingButtonSpec = {
  width: 100,           // px（横幅）
  height: 100,          // px（高さ）
  borderRadius: '50%',  // 完全な円形
  touchTarget: 100,     // 最小タッチサイズ
  fontSize: 48,         // フォントサイズ（「トン！」）
  fontWeight: 'bold',   // 太字
};
```

**タッチターゲット**:

- 最小サイズ: 100×100px
- 実際のボタンサイズ: 100×100px以上
- 理由: 連打精度向上、指が届きやすい

### レトロボタンスタイリング

相撲テーマのレトロなボタンデザインを採用します。

**CSS実装例**:

```css
.tapping-button {
  /* 基本スタイル */
  font-family: 'M PLUS 1', sans-serif;
  border: 4px solid var(--retro-dark);  /* #1a0f08 */
  background: var(--tap-button);  /* #ffd700 */
  color: var(--retro-bg);  /* #3d2817 */
  font-size: 48px;
  font-weight: bold;
  width: 100px;
  height: 100px;
  cursor: pointer;
  position: relative;

  /* 円形 */
  border-radius: 50%;

  /* ユーザー選択無効化 */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;

  /* タップエフェクト準備 */
  transition: transform 0.05s ease-out;
}

/* タップ時の視覚フィードバック */
.tapping-button:active {
  transform: scale(0.9);
  filter: brightness(0.8);
}

/* タップレート表示 */
.tap-rate-display {
  font-family: 'M PLUS 1', sans-serif;
  font-size: 18px;
  color: var(--retro-fg);
  text-align: center;
  margin-top: 8px;
}
```

**レトロカラーパレット**（相撲テーマ）:

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

---

## タップ戦略

### 連打テクニック

タップレートを高めることで、より強い力で相手を押せます。

**効果的な連打**:

1. **リズミカルな連打**:
   - 一定のリズムで連打（3-5 taps/s）
   - 不規則なタップより効果的
   - 疲れにくい

2. **爆発的な連打**:
   - 短時間で集中的に連打（8-10 taps/s）
   - 土俵際で使用
   - 一気に押し出す

3. **調整タップ**:
   - 必要に応じて強弱をつける
   - 相手の位置を見て判断
   - 無駄な力を使わない

### 戦略的タップ

**状況別の使い分け**:

1. **序盤（両者中央）**:
   - リズミカルな連打でジワジワ押す
   - 相手を土俵際に追い込む
   - 傾きを蓄積させる

2. **中盤（相手が土俵際）**:
   - 爆発的な連打で押し出し狙い
   - または傾きを限界まで増やす
   - 一気に決着をつける

3. **終盤（自分が土俵際）**:
   - 必死の連打で押し返す
   - タップレート最大化
   - 逆転を狙う

**コンボ例**:

```
リズミカルな連打（3秒） → 爆発的な連打（1秒）
→ 相手を土俵際に追い込み、一気に押し出す

調整タップ → リズミカルな連打 → 爆発的な連打
→ 位置を調整しつつ、徐々に圧力を強める
```

---

## 視覚フィードバック

### タップフィードバック

**即座の応答**:

1. **視覚**: ボタンのスケール変化（scale(0.9)、即座）
2. **タップレート表示**: 「5 taps/s」のようにリアルタイム更新
3. **力士の動き**: 物理エンジンによる自然な動き
4. **転倒ゲージ**: 傾き度の視覚化（0-100%）
5. **サウンド**: タップ音再生（オプション）
6. **触覚**: バイブレーション（軽く、対応デバイス）

**実装**:

```typescript
function handleTap() {
  if (gameState !== 'battle') return;

  // タップを記録
  tapTracker.addTap();

  // タップ力を適用
  const tapRate = tapTracker.getTapRate();
  applyTapForce(player, tapRate);

  // タップレート表示更新
  setDisplayedTapRate(tapRate);

  // サウンドフィードバック（オプション）
  if (soundEnabled) {
    playTapSound();
  }

  // 触覚フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(10); // 軽いバイブレーション
  }
}
```

### 転倒ゲージ表示

**転倒度ビジュアル**:

```typescript
// 転倒度を0-100%で表示
const tippingPercentage = tipping * 100; // 0.0-1.0 → 0-100

// ゲージの色を変化
const gaugeColor =
  tippingPercentage < 50 ? 'var(--tipping-safe)' :    // 緑
  tippingPercentage < 80 ? 'var(--tipping-warning)' : // 黄
  'var(--tipping-danger)';                            // 赤

<div className="tipping-gauge">
  <div
    className="tipping-gauge-fill"
    style={{
      width: `${tippingPercentage}%`,
      backgroundColor: gaugeColor
    }}
  />
  <div className="tipping-gauge-label">
    転倒度: {tippingPercentage.toFixed(0)}%
  </div>
</div>
```

**ゲージ仕様**:

```css
.tipping-gauge {
  width: 200px;
  height: 24px;
  border: 2px solid var(--retro-dark);
  background: rgba(0, 0, 0, 0.3);
  position: relative;
  font-family: 'M PLUS 1', sans-serif;
}

.tipping-gauge-fill {
  height: 100%;
  transition: width 0.1s linear, background-color 0.2s ease;
}

.tipping-gauge-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--retro-fg);
  font-size: 14px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}
```

---

## HUDコンポーネント

### 転倒ゲージ（両者）

画面上部に配置し、両者の転倒度を常時表示します。

**レイアウト**:

```
┌────────────────────────────────────────┐
│  プレイヤー転倒度: ▓▓▓░░░░░░░ 30%    │
│  AI転倒度:         ▓▓▓▓▓▓▓▓░░ 80%    │
└────────────────────────────────────────┘
```

**実装**:

```typescript
interface HUDProps {
  playerTipping: number;  // 0.0-1.0
  opponentTipping: number;  // 0.0-1.0
}

function HUD({ playerTipping, opponentTipping }: HUDProps) {
  return (
    <div className="hud">
      <TippingGauge
        label="プレイヤー転倒度"
        tipping={playerTipping}
      />
      <TippingGauge
        label="AI転倒度"
        tipping={opponentTipping}
      />
    </div>
  );
}
```

### タップレート表示

ボタンの下に現在のタップレートを表示します。

```typescript
interface TapRateDisplayProps {
  tapRate: number;  // taps per second
}

function TapRateDisplay({ tapRate }: TapRateDisplayProps) {
  return (
    <div className="tap-rate-display">
      {tapRate.toFixed(1)} taps/s
    </div>
  );
}
```

---

## アクセシビリティ

### タッチターゲット

- **最小サイズ**: 100×100px（連打しやすい大きさ）
- **配置**: 画面中央下部（親指が届きやすい）
- **余白**: 周囲に十分な余白（誤タップ防止）

### 視覚的フィードバック

- **タップ時**: スケール変化（0.9倍）、即座
- **転倒ゲージ**: 色変化（緑 → 黄 → 赤）、明確
- **タップレート表示**: リアルタイム更新、数値表示

### 触覚フィードバック

```typescript
// バイブレーション対応
if ('vibrate' in navigator) {
  navigator.vibrate(10); // 10ms、軽いバイブレーション
}
```

**対応デバイス**:
- iOS Safari: Taptic Engine対応
- Android Chrome: バイブレーション対応

---

## パフォーマンス最適化

### タップイベント最適化

```typescript
// Passive event listener（スクロールパフォーマンス向上）
button.addEventListener('touchstart', handleTap, { passive: true });

// デバウンス不要（タップは全て記録）
function handleTap() {
  tapTracker.addTap(); // スライディングウィンドウで自動管理
}
```

### レンダリング最適化

```typescript
// React.memo でタップレート表示のみ更新
const TapRateDisplay = React.memo(({ tapRate }) => (
  <div className="tap-rate-display">
    {tapRate.toFixed(1)} taps/s
  </div>
));

// 転倒ゲージはtippingが変化した時のみ更新
const TippingGauge = React.memo(({ tipping }) => {
  // ...
}, (prevProps, nextProps) =>
  prevProps.tipping === nextProps.tipping
);
```

---

## 画面遷移

### タイトル画面

**レイアウト**:

```
┌────────────────────────┐
│    相撲バトル          │
│                        │
│   現在の番付: 関脇     │
│   戦績: 15勝 7敗       │
│   あと2勝で大関        │
│                        │
│   ┌──────────┐        │
│   │ 試合開始 │        │
│   └──────────┘        │
└────────────────────────┘
```

**実装**:

```typescript
interface TitleScreenProps {
  currentRank: SumoRank;  // 0-4
  totalWins: number;
  totalLosses: number;
  consecutiveWins: number;
  onStartBattle: () => void;
}

function TitleScreen(props: TitleScreenProps) {
  const rankName = getRankName(props.currentRank);
  const winsToPromotion = getWinsToPromotion(props.consecutiveWins);

  return (
    <div className="title-screen">
      <h1 className="title">相撲バトル</h1>
      <div className="rank-display">
        <div className="rank-badge">{rankName}</div>
        <div className="record">
          戦績: {props.totalWins}勝 {props.totalLosses}敗
        </div>
        {winsToPromotion > 0 && (
          <div className="promotion-info">
            あと{winsToPromotion}勝で{getNextRankName(props.currentRank)}
          </div>
        )}
      </div>
      <button
        className="start-button"
        onClick={props.onStartBattle}
      >
        試合開始
      </button>
    </div>
  );
}
```

### リザルト画面

**レイアウト**:

```
┌────────────────────────┐
│      勝利！            │
│                        │
│   転倒率: 85%          │
│   相手転倒率: 100%     │
│                        │
│   昇進！新 大関        │
│   (ゴールドエフェクト) │
│                        │
│   ┌──────────┐        │
│   │ 連続挑戦 │        │
│   └──────────┘        │
│   ┌──────────┐        │
│   │タイトルへ│        │
│   └──────────┘        │
└────────────────────────┘
```

**実装**:

```typescript
interface ResultScreenProps {
  winner: 'player' | 'opponent';
  playerTipping: number;  // 最終転倒度
  opponentTipping: number;
  rankChange: 'promoted' | 'demoted' | 'maintained';
  newRank: SumoRank;
  consecutiveWins: number;
  onContinue: () => void;
  onBackToTitle: () => void;
}

function ResultScreen(props: ResultScreenProps) {
  const isVictory = props.winner === 'player';
  const rankName = getRankName(props.newRank);

  return (
    <div className="result-screen">
      <h2 className={isVictory ? 'victory' : 'defeat'}>
        {isVictory ? '勝利！' : '敗北...'}
      </h2>

      <div className="stats">
        <div>転倒率: {(props.playerTipping * 100).toFixed(0)}%</div>
        <div>相手転倒率: {(props.opponentTipping * 100).toFixed(0)}%</div>
      </div>

      {props.rankChange === 'promoted' && (
        <div className="rank-change promoted">
          昇進！新 {rankName}
        </div>
      )}
      {props.rankChange === 'demoted' && (
        <div className="rank-change demoted">
          降格... {rankName}
        </div>
      )}
      {props.rankChange === 'maintained' && (
        <div className="rank-change maintained">
          連勝: {props.consecutiveWins}/3
        </div>
      )}

      <button className="continue-button" onClick={props.onContinue}>
        連続挑戦
      </button>
      <button className="title-button" onClick={props.onBackToTitle}>
        タイトルへ
      </button>
    </div>
  );
}
```

---

## 番付システム表示

### 番付バッジ

```css
.rank-badge {
  font-family: 'M PLUS 1', sans-serif;
  font-size: 48px;
  font-weight: bold;
  color: var(--retro-fg);
  background: var(--retro-accent);
  border: 4px solid var(--retro-dark);
  padding: 16px 32px;
  border-radius: 8px;
  text-align: center;
}
```

### 昇進エフェクト

```css
.rank-change.promoted {
  background: var(--action-special);  /* ゴールド */
  color: var(--retro-bg);
  font-size: 32px;
  font-weight: bold;
  padding: 16px;
  border-radius: 8px;
  animation: promotion-pulse 1s ease-in-out infinite;
}

@keyframes promotion-pulse {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.2);
  }
}
```

### 降格表示

```css
.rank-change.demoted {
  background: rgba(255, 0, 0, 0.3);
  color: var(--retro-fg);
  font-size: 24px;
  padding: 12px;
  border-radius: 8px;
}
```

---

## レスポンシブデザイン

### 画面サイズ対応

```css
/* スマホ縦持ち（〜600px） */
@media (max-width: 600px) {
  .tapping-button {
    width: 100px;
    height: 100px;
    font-size: 48px;
  }

  .hud {
    font-size: 14px;
  }
}

/* タブレット（601-1024px） */
@media (min-width: 601px) and (max-width: 1024px) {
  .tapping-button {
    width: 120px;
    height: 120px;
    font-size: 56px;
  }

  .hud {
    font-size: 16px;
  }
}

/* デスクトップ（1025px〜） */
@media (min-width: 1025px) {
  .tapping-button {
    width: 140px;
    height: 140px;
    font-size: 64px;
  }

  .hud {
    font-size: 18px;
  }
}
```

### タッチデバイス最適化

```css
/* タッチデバイス用の調整 */
@media (hover: none) and (pointer: coarse) {
  .tapping-button {
    /* タッチ操作に最適化 */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  /* ボタンのホバー効果を無効化 */
  .tapping-button:hover {
    transform: none;
  }

  /* タップ時のフィードバックを強化 */
  .tapping-button:active {
    transform: scale(0.9);
    filter: brightness(0.8);
  }
}
```

---

## テスト項目

### 操作テスト

- [ ] タップボタンが反応する
- [ ] タップレートが正確に測定される（TapTracker）
- [ ] 連打が物理エンジンに正しく反映される
- [ ] タップレート表示がリアルタイム更新される
- [ ] 転倒ゲージが正確に表示される
- [ ] バイブレーションが動作する（対応デバイス）

### 視覚フィードバックテスト

- [ ] タップ時にボタンがスケール変化する
- [ ] 転倒ゲージの色が適切に変化する（緑 → 黄 → 赤）
- [ ] タップレート表示が見やすい
- [ ] 画面遷移がスムーズ

### アクセシビリティテスト

- [ ] タッチターゲットが十分な大きさ（100×100px以上）
- [ ] ボタンが親指で届く位置に配置されている
- [ ] 視覚的フィードバックが明確
- [ ] 誤タップが起きにくい配置

### パフォーマンステスト

- [ ] 連打中もFPSが30fps以上維持される
- [ ] タップイベントの遅延がない（<50ms）
- [ ] レンダリングが滑らか

---

## 参考資料

**フォント**:
- [M PLUS 1 Font](https://fonts.google.com/specimen/M+PLUS+1) - 日本語対応レトロ風フォント

**レトロデザイン**:
- 8bit Color Palette - レトロゲーム風カラー
- 相撲テーマカラー（土俵の土色、まわし色）

**タッチ操作**:
- iOS Human Interface Guidelines - Touch Targets
- Android Material Design - Touch Targets (最低48×48dp)

**物理エンジン**:
- カスタム実装（~100行）- 重力、減衰、衝突、転倒判定
