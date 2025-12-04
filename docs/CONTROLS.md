# 操作システム仕様

レトロ風紙相撲バトルゲーム（MVP）の操作システムとUIインタラクションを説明します。

## 設計原則

### モバイルファースト

- タッチ操作専用設計
- 連打しやすい大型ボタン
- 最小タッチターゲット: 80×80px
- 誤タップ防止の配慮

### シンプル操作

- タップボタン2つのみ（強プッシュ/弱プッシュ）
- 複雑なジェスチャー不要
- 直感的な配置
- 連打しやすい設計

## 入力システム

### タップイベント処理

```typescript
interface TapInputSystem {
  handleTap(button: TapButton): void;
  trackTapRate(): number;
  getTapRate(): number;  // タップ/秒
}
```

**イベントフロー**:

```
Tap Input
    ↓
ボタン判定（強/弱）
    ↓
TapTracker.addTap()
    ↓
getTapRate() → タップ速度計測
    ↓
TapForceConverter
    ├→ 強プッシュ: baseForce + tapRate * 1.5
    └→ 弱プッシュ: baseForce + tapRate * 0.8
        ↓
PhysicsEngine.applyTapForce()
    ↓
視覚フィードバック（ボタン押下アニメーション）
```

### 入力抽象化レイヤー

タップイベントをゲームアクションに変換：

```typescript
class InputAdapter {
  // タップを物理的な力に変換
  mapTapToForce(button: TapButton, tapRate: number): {
    force: number;
    tippingIncrease: number;
  } {
    return this.tapForceConverter.getForce(button, tapRate);
  }

  // ボタン検出
  detectButton(touch: Touch): TapButton | null {
    const { clientX, clientY } = touch;
    return this.buttons.find(btn =>
      this.isInside(clientX, clientY, btn.bounds)
    )?.type;
  }
}
```

## タップボタン

### ボタン種類（レトロスタイル）

**2つの基本アクション**（8bitカラーパレット使用）:

1. **強プッシュ (Strong Push)**
   - ラベル: 「強」（PixelMplusフォント）
   - 色: 赤系（#ff4444）
   - 配置: 左下
   - 特性: 高速前進、転倒リスク大

2. **弱プッシュ (Weak Push)**
   - ラベル: 「弱」（PixelMplusフォント）
   - 色: 青系（#4444ff）
   - 配置: 右下
   - 特性: 安定前進、転倒リスク小

**レトロデザイン特徴**:
- 太い境界線（4px）
- 押下時のスケール変化
- PixelMplusフォント使用
- 大きく明瞭なラベル

### ボタン配置

```
画面レイアウト:

┌────────────────────────┐
│                        │
│  傾きインジケーター     │
│                        │
│                        │
│      ゲーム画面         │
│     (3D土俵シーン)      │
│                        │
│                        │
└────────────────────────┘
│   [強]         [弱]    │ ← タップボタン領域
└────────────────────────┘
```

**配置仕様**:

- 画面下部に固定
- 左右に分離配置
- 親指が届く範囲（画面下から15%以内）
- 横幅: 各ボタン画面の40%使用（中央20%は空白）

### ボタンサイズ

```typescript
const tapButtonSpec = {
  width: 120,       // px（連打しやすい大型サイズ）
  height: 100,      // px
  borderRadius: 8,  // 角丸
  margin: 20,       // ボタン間隔（中央空白）
  touchTarget: 140  // 実際のタッチ領域（余白含む）
};
```

**タッチターゲット**:

- 視覚サイズ: 120×100px（見た目）
- タッチ判定: 140×120px（内部処理）
- 理由: 連打時の精度向上、指の大きさを考慮

### レトロボタンスタイリング（MVP）

MVPでは8bitゲーム風のレトロボタンデザインを採用します。

**CSS実装例**:

```css
.tap-button {
  /* 基本スタイル */
  font-family: 'PixelMplus', monospace;
  border: 4px solid var(--retro-dark);  /* #306230 */
  color: var(--retro-bg);  /* #0f380f */
  font-size: 32px;
  font-weight: bold;
  padding: 24px;
  cursor: pointer;
  min-width: 80px;
  min-height: 80px;

  /* シャープなエッジ */
  border-radius: 8px;
  image-rendering: pixelated;

  /* ユーザー選択無効化（連打時のテキスト選択防止） */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* 強プッシュボタン */
.tap-button.strong {
  background: var(--strong-push);  /* #ff4444 */
}

/* 弱プッシュボタン */
.tap-button.weak {
  background: var(--weak-push);  /* #4444ff */
}

/* 押下状態 */
.tap-button:active {
  /* スケール縮小で押下感 */
  transform: scale(0.95);

  /* 明度低下 */
  filter: brightness(0.8);

  /* トランジション無効化（即座の反応） */
  transition: none;
}

/* 無効状態 */
.tap-button:disabled {
  background: var(--retro-dark);
  color: var(--retro-bg);
  opacity: 0.5;
  cursor: not-allowed;
}
```

**レトロカラーパレット**:

```css
:root {
  --retro-bg: #0f380f;      /* 濃い緑（背景） */
  --retro-fg: #9bbc0f;      /* 明るい緑（文字） */
  --retro-accent: #8bac0f;  /* 中間緑（ボタン） */
  --retro-dark: #306230;    /* 暗い緑（影・境界） */

  --strong-push: #ff4444;   /* 強プッシュ（赤系） */
  --weak-push: #4444ff;     /* 弱プッシュ（青系） */
}
```

## ボタン状態

### 通常状態 (Normal)

**表示**:
- フル彩度の色
- ラベル明瞭
- タップ可能

**実装**:

```css
.tap-button {
  background: var(--button-color);
  opacity: 1.0;
  cursor: pointer;
}
```

### アクティブ状態 (Active)

**タップ中の表示**:

- スケール縮小（0.95倍）
- 明度低下（80%）
- 即座の反応（トランジション無効）

**実装**:

```typescript
onTouchStart(button: TapButton) {
  button.element.classList.add('active');
  this.tapTracker.addTap();  // タップ記録
}

onTouchEnd(button: TapButton) {
  button.element.classList.remove('active');
}
```

## タップトラッキング

### タップ速度計測

```typescript
class TapTracker {
  private taps: number[] = [];
  private readonly WINDOW = 1000;  // 1秒間のウィンドウ

  addTap(timestamp: number = Date.now()): void {
    this.taps.push(timestamp);
    this.cleanup(timestamp);
  }

  private cleanup(currentTime: number): void {
    const cutoff = currentTime - this.WINDOW;
    this.taps = this.taps.filter(t => t >= cutoff);
  }

  getTapRate(): number {
    return this.taps.length;  // タップ/秒
  }

  clear(): void {
    this.taps = [];
  }
}
```

**計測の流れ**:

```
ボタンタップ
    ↓
timestamp記録（Date.now()）
    ↓
配列に追加
    ↓
1秒より古いタップを削除
    ↓
配列の長さ = タップ/秒
```

## 視覚フィードバック

### タップフィードバック

**即座の応答**:

1. **視覚**: ボタンのスケール変化（トランジション無効、即座）
2. **サウンド**: タップ音再生（オプション）
3. **触覚**: バイブレーション（対応デバイス）

**実装**:

```typescript
class FeedbackSystem {
  onButtonTap(button: TapButton) {
    // 視覚フィードバック（CSS :active で自動）
    // ボタンは押されている間 scale(0.95) + brightness(0.8)

    // 音声フィードバック（オプション）
    if (this.soundEnabled) {
      this.playSound('button_tap');
    }

    // 触覚フィードバック
    if (navigator.vibrate) {
      navigator.vibrate(5);  // 5ms（軽い振動）
    }
  }
}
```

### 傾きインジケーター

**画面上部に表示**:

```
┌────────────────────────┐
│ プレイヤー  [===  ]  AI│ ← 傾きバー（緑→黄→赤）
│    50%              30%│
└────────────────────────┘
```

**傾き度表示**:
- 0-40%: 緑色（安全）
- 40-70%: 黄色（警告）
- 70-100%: 赤色（危険）

**実装**:

```typescript
function getTippingColor(tipping: number): string {
  if (tipping < 0.4) return 'var(--tipping-safe)';     // 緑
  if (tipping < 0.7) return 'var(--tipping-warning)';  // 黄
  return 'var(--tipping-danger)';                      // 赤
}
```

## アクセシビリティ

### タッチターゲットサイズ

**WCAG 2.1 AAA基準**:

- 最小サイズ: 44×44px
- 推奨サイズ: 48×48px以上
- 実装: 120×100px（連打しやすさ重視）

**ボタン間隔**:

- 中央空白: 20%（画面幅の）
- 理由: 誤タップ防止、左右の手で分けやすい

### 視覚フィードバック

**色覚対応**:

- 色だけに依存しない（ラベル「強」「弱」で明確に区別）
- ボタン種類ごとに異なる色（赤系/青系）
- 傾きインジケーターも色+パーセンテージ表示

**コントラスト**:

- ボタン背景と画面背景: 最低4.5:1
- ラベルとボタン背景: 最低4.5:1

### 触覚フィードバック

**バイブレーション対応**:

```typescript
const vibrationPatterns = {
  buttonTap: 5,           // 軽いタップ（連打時の負担軽減）
  fallen: 100,            // 転倒時（強い振動）
  ringOut: [50, 30, 50],  // 土俵外（パターン）
  victory: [50, 20, 50, 20, 100]  // 勝利（複雑なパターン）
};
```

**対応端末**:

- iOS Safari: 限定的（Touch IDイベント時のみ）
- Android Chrome: 完全対応
- デスクトップ: 非対応（無視）

### レスポンシブ対応

**画面サイズ別調整**:

```typescript
// 小画面（iPhone SE）
if (screenWidth < 375) {
  buttonWidth = 100;   // 少し小さく
  buttonHeight = 80;
  margin = 15;
}

// 大画面（iPad）
if (screenWidth > 768) {
  buttonWidth = 150;   // 大きく
  buttonHeight = 120;
  margin = 30;
}
```

## UIコンポーネント構造

### TapButton Component

```typescript
interface TapButtonProps {
  type: 'strong' | 'weak';
  onTap: () => void;
  disabled: boolean;
}

function TapButton({
  type,
  onTap,
  disabled
}: TapButtonProps): JSX.Element {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    if (disabled) return;
    setIsPressed(true);
    onTap();  // タップを即座に記録
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <button
      className={`tap-button tap-button--${type} ${isPressed ? 'active' : ''}`}
      disabled={disabled}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}  // デスクトップ対応
      onMouseUp={handleTouchEnd}
    >
      {type === 'strong' ? '強' : '弱'}
    </button>
  );
}
```

### TapButtons Container

```typescript
interface TapButtonsProps {
  onTap: (button: TapButton) => void;
  disabled: boolean;  // ゲーム停止中など
}

function TapButtons({
  onTap,
  disabled
}: TapButtonsProps): JSX.Element {
  return (
    <div className="tap-buttons">
      <TapButton
        type="strong"
        onTap={() => onTap('strong')}
        disabled={disabled}
      />
      <TapButton
        type="weak"
        onTap={() => onTap('weak')}
        disabled={disabled}
      />
    </div>
  );
}
```

## デバッグ機能

### タップ可視化

**開発モード限定**:

```typescript
if (import.meta.env.DEV) {
  // タップレート表示
  const tapRateDisplay = document.createElement('div');
  tapRateDisplay.className = 'tap-rate-debug';
  tapRateDisplay.textContent = `Tap Rate: ${tapTracker.getTapRate()} taps/sec`;

  // 毎フレーム更新
  requestAnimationFrame(() => {
    tapRateDisplay.textContent = `Tap Rate: ${tapTracker.getTapRate()} taps/sec`;
  });
}
```

**表示内容**:

- タップ速度（taps/sec）
- 現在の力の大きさ
- 傾き度合い（0-1）

### 入力ログ

**コンソールログ出力**:

```typescript
logger.debug('Tap Input', {
  button: 'strong',
  tapRate: tapTracker.getTapRate(),
  force: calculatedForce,
  tippingIncrease: calculatedTipping,
  timestamp: Date.now()
});
```

## パフォーマンス最適化

### イベント最適化

**パッシブリスナー**:

```typescript
element.addEventListener('touchstart', handler, {
  passive: true  // スクロールパフォーマンス向上
});
```

**連打時の最適化**:

```typescript
// タップトラッキングのスロットリング不要
// 各タップを正確に記録する必要がある

// ただし、UIフィードバックは60fps制限
requestAnimationFrame(() => {
  this.updateTapRateDisplay();
});
```

### レンダリング最適化

**React.memo使用**:

```typescript
export const TapButton = React.memo(
  TapButtonComponent,
  (prev, next) => {
    // 必要な場合のみ再レンダリング
    return prev.disabled === next.disabled;
  }
);
```

**CSSアニメーション優先**:

- transform / filter のみ使用（GPU加速）
- width / height の変更を避ける（リフロー防止）
- transition無効化（:active時の即座の反応）

## テスト戦略

### 単体テスト

**TapTrackerのテスト**:

```typescript
describe('TapTracker', () => {
  it('should track tap rate correctly', () => {
    const tracker = new TapTracker();

    // 1秒間に5回タップをシミュレート
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      tracker.addTap(now + i * 200);
    }

    expect(tracker.getTapRate()).toBe(5);
  });

  it('should cleanup old taps', () => {
    const tracker = new TapTracker();
    const now = Date.now();

    tracker.addTap(now - 2000);  // 2秒前（削除されるべき）
    tracker.addTap(now);          // 現在

    expect(tracker.getTapRate()).toBe(1);
  });
});
```

### 統合テスト

**ボタンタップフローのテスト**:

```typescript
it('should apply force on button tap', async () => {
  const onTap = jest.fn();
  render(<TapButtons onTap={onTap} />);

  const strongButton = screen.getByText('強');
  fireEvent.touchStart(strongButton);

  expect(onTap).toHaveBeenCalledWith('strong');
});
```

### E2Eテスト

**実機テスト項目**:

- [ ] 各ボタンが連打に反応する
- [ ] タップ速度が正確に計測される
- [ ] 高速連打（10+ taps/sec）でも正確
- [ ] 視覚フィードバックが即座に表示される
- [ ] バイブレーションが動作する（対応端末）
- [ ] 誤タップが発生しにくい（中央空白効果）

## トラブルシューティング

### よくある問題

**問題: ボタンが連打に反応しない**

原因:
- イベントのデバウンスやスロットリングが適用されている
- onTouchEndでのみ処理している（onTouchStartで処理すべき）

解決:

```typescript
// ✅ 正しい：onTouchStartで即座に処理
onTouchStart={() => {
  tapTracker.addTap();
  onTap(buttonType);
}}

// ❌ 間違い：onTouchEndで処理（遅延が発生）
onTouchEnd={() => {
  onTap(buttonType);
}}
```

**問題: タップ速度が正確に計測されない**

原因:
- ウィンドウサイズが正しくない
- 古いタップのクリーンアップが動作していない

解決:

```typescript
// 毎回addTap時にクリーンアップを実行
addTap(timestamp: number = Date.now()): void {
  this.taps.push(timestamp);
  this.cleanup(timestamp);  // 必須
}
```

**問題: 連打時にテキストが選択される**

原因:
- user-selectが無効化されていない

解決:

```css
.tap-button {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
```

## まとめ

### 設計の要点（MVP）

1. **レトロデザイン**: 8bitカラーパレット、PixelMplusフォント、太い境界線
2. **シンプルな操作**: 2ボタン連打のみ（強/弱）
3. **明確なフィードバック**: 視覚・聴覚・触覚、即座の反応
4. **正確なタップ計測**: 1秒ウィンドウで連続タップ追跡
5. **アクセシビリティ**: 大きなタッチターゲット、明確なラベル
6. **パフォーマンス**: GPU加速アニメーション、トランジション無効化

### 拡張可能性

将来的な機能追加の余地:

- カスタムボタン配置（設定画面）
- タップ速度表示（リアルタイム）
- タップ履歴グラフ
- ベストタップ速度記録

## 参考資料

- [Apple Human Interface Guidelines - Touch](https://developer.apple.com/design/human-interface-guidelines/ios/user-interaction/gestures/)
- [Material Design - Touch targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
