# 操作システム仕様

レトロ風相撲バトルゲーム（MVP）の操作システムとUIインタラクションを説明します。

## 設計原則

### モバイルファースト

- タッチ操作専用設計
- 親指での片手操作を想定
- 最小タッチターゲット: 60×60px
- 誤タップ防止の配慮

### シンプル操作

- アクションボタン3つのみ
- 複雑なジェスチャー不要
- 直感的な配置
- 即座のフィードバック

## 入力システム

### タッチイベント処理

```typescript
interface TouchInputSystem {
  handleTouchStart(e: TouchEvent): void;
  handleTouchEnd(e: TouchEvent): void;
  handleTouchMove(e: TouchEvent): void;
}
```

**イベントフロー**:

```
Touch Start
    ↓
ボタン判定
    ↓
アクション実行可能チェック
├→ クールダウン中 → キャンセル
├→ ゲージ不足 → キャンセル（スペシャルのみ）
└→ 実行可能 → アクション発動
    ↓
視覚フィードバック
    ↓
Touch End
```

### 入力抽象化レイヤー

タッチイベントをゲームアクションに変換：

```typescript
class InputAdapter {
  // タッチをアクションに変換
  mapTouchToAction(touch: Touch): Action | null {
    const button = this.detectButton(touch);
    if (!button) return null;

    return this.createAction(button.type);
  }

  // ボタン検出
  detectButton(touch: Touch): ActionButton | null {
    const { clientX, clientY } = touch;
    return this.buttons.find(btn =>
      this.isInside(clientX, clientY, btn.bounds)
    );
  }
}
```

## アクションボタン

### ボタン種類（レトロスタイル）

**3つの基本アクション**（8bitカラーパレット使用）:

1. **押す (Push)**
   - アイコン: 手のひらマーク（ドット絵風）
   - 色: レトロアクセント（#8bac0f）
   - 配置: 左下

2. **つっぱり (Tsuppari)**
   - アイコン: 拳マーク（ドット絵風）
   - 色: レトロ中間緑（#9bbc0f）
   - 配置: 中央下

3. **スペシャル (Special)**
   - アイコン: 星マーク（ドット絵風）
   - 色: レトロダーク（#306230）
   - 配置: 右下

**レトロデザイン特徴**:
- 太い境界線（4px）
- 押下時の色反転
- PixelMplusフォント使用
- シンプルなドット絵アイコン

### ボタン配置

```
画面レイアウト:

┌────────────────────────┐
│                        │
│     HUD (HP, ゲージ)    │
│                        │
│                        │
│      ゲーム画面         │
│                        │
│                        │
└────────────────────────┘
│ [押す] [つっぱり] [SP] │ ← ボタン領域
└────────────────────────┘
```

**配置仕様**:

- 画面下部に固定
- 横並び（等間隔）
- 親指が届く範囲（画面下から15%以内）
- 横幅: 画面の90%使用（両端5%マージン）

### ボタンサイズ

```typescript
const buttonSpec = {
  width: 80,        // px
  height: 80,       // px
  borderRadius: 40, // 円形
  margin: 10,       // ボタン間隔
  touchTarget: 100  // 実際のタッチ領域（余白含む）
};
```

**タッチターゲット**:

- 視覚サイズ: 80×80px（見た目）
- タッチ判定: 100×100px（内部処理）
- 理由: 指の大きさを考慮（Apple HIG推奨: 44pt以上）

### レトロボタンスタイリング（MVP）

MVPでは8bitゲーム風のレトロボタンデザインを採用します。

**CSS実装例**:

```css
.retro-button {
  /* 基本スタイル */
  font-family: 'PixelMplus', monospace;
  background: var(--retro-accent);  /* #8bac0f */
  border: 4px solid var(--retro-dark);  /* #306230 */
  color: var(--retro-bg);  /* #0f380f */
  font-size: 24px;
  padding: 16px 32px;
  cursor: pointer;

  /* シャープなエッジ */
  border-radius: 0;
  image-rendering: pixelated;

  /* ボックスシャドウでドット絵風深度 */
  box-shadow:
    4px 4px 0 var(--retro-dark),
    8px 8px 0 rgba(0, 0, 0, 0.3);
}

/* 押下状態 */
.retro-button:active {
  background: var(--retro-dark);  /* 色反転 */
  color: var(--retro-fg);  /* #9bbc0f */

  /* シャドウ削減で押下感 */
  box-shadow:
    2px 2px 0 var(--retro-dark),
    4px 4px 0 rgba(0, 0, 0, 0.3);

  /* 位置微調整 */
  transform: translate(2px, 2px);
}

/* 無効状態 */
.retro-button:disabled {
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
}
```

## ボタン状態

### 通常状態 (Normal)

**表示**:
- フル彩度の色
- アイコン明瞭
- ドロップシャドウ
- タップ可能

**実装**:

```css
.action-button {
  background: var(--button-color);
  opacity: 1.0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}
```

### クールダウン状態 (Cooldown)

**表示**:
- 彩度低下（グレーアウト）
- 円形プログレス表示
- タップ不可

**実装**:

```typescript
interface CooldownDisplay {
  remaining: number;    // 残り時間 (ms)
  total: number;        // 総時間 (ms)
  progress: number;     // 0.0-1.0
}
```

**プログレス表示**:

```css
.cooldown-overlay {
  /* 円形プログレス */
  stroke-dasharray: 251.2; /* 2πr (r=40) */
  stroke-dashoffset: calc(251.2 * (1 - var(--progress)));
  transition: stroke-dashoffset 50ms linear;
}
```

### ゲージ不足状態 (Insufficient Gauge)

**スペシャルボタンのみ**:

- ゲージ100未満で無効化
- 彩度低下
- ロックアイコン表示（オプション）
- タップしても反応なし

### アクティブ状態 (Active)

**タップ中の表示**:

- スケール縮小（0.95倍）
- 明度上昇
- タップ位置にリップルエフェクト

**実装**:

```typescript
onTouchStart(button: ActionButton) {
  button.scale = 0.95;
  button.brightness = 1.2;
  this.playRippleEffect(button);
}

onTouchEnd(button: ActionButton) {
  button.scale = 1.0;
  button.brightness = 1.0;
}
```

## 視覚フィードバック

### タップフィードバック

**即座の応答**:

1. **視覚**: ボタンのスケール変化（50ms以内）
2. **サウンド**: タップ音再生
3. **触覚**: バイブレーション（対応デバイス）

**実装**:

```typescript
class FeedbackSystem {
  onButtonTap(button: ActionButton) {
    // 視覚フィードバック
    this.animateButton(button);

    // 音声フィードバック
    this.playSound('button_tap');

    // 触覚フィードバック
    if (navigator.vibrate) {
      navigator.vibrate(10); // 10ms
    }
  }
}
```

### リップルエフェクト

**タップ位置から広がる波紋**:

```typescript
interface RippleEffect {
  x: number;          // タップ位置X
  y: number;          // タップ位置Y
  radius: number;     // 現在の半径
  maxRadius: number;  // 最大半径（ボタン半径の1.5倍）
  opacity: number;    // 透明度（1.0 → 0.0）
  duration: 400;      // ms
}
```

**アニメーション**:

- 半径: 0 → maxRadius (easeOut)
- 透明度: 1.0 → 0.0 (linear)
- 色: ボタン色の薄い版

### クールダウン表示

**円形プログレスバー**:

```
 ┌─────────┐
 │  ●●●    │ ← プログレス（時計回り）
 │ ●   ●   │
 │●  👊  ●│ ← アイコン（中央）
 │ ●   ●   │
 │  ●●●    │
 └─────────┘
```

**仕様**:

- 外周に沿った円形ゲージ
- 時計回りで減少
- 色: 白（半透明）
- 幅: 4px
- 残り時間テキスト表示（オプション）

## アクセシビリティ

### タッチターゲットサイズ

**WCAG 2.1 AAA基準**:

- 最小サイズ: 44×44px
- 推奨サイズ: 48×48px以上
- 実装: 100×100px（余裕を持った設計）

**ボタン間隔**:

- 最小間隔: 10px
- 理由: 誤タップ防止

### 視覚フィードバック

**色覚対応**:

- 色だけに依存しない（形状とアイコンでも判別可能）
- ボタン種類ごとに異なるアイコン
- 無効状態は彩度低下＋透明度変更

**コントラスト**:

- ボタン背景と画面背景: 最低4.5:1
- アイコンとボタン背景: 最低3:1
- テキストとボタン背景: 最低4.5:1

### 触覚フィードバック

**バイブレーション対応**:

```typescript
const vibrationPatterns = {
  buttonTap: 10,        // 軽いタップ
  actionSuccess: 50,    // アクション成功
  actionFailed: [30, 20, 30], // 失敗（パターン）
  specialReady: [50, 30, 50]  // ゲージ満タン
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
  buttonSize = 70; // 少し小さく
}

// 大画面（iPad）
if (screenWidth > 768) {
  buttonSize = 100; // 大きく
  margin = 20;      // 間隔も広く
}
```

## UIコンポーネント構造

### ActionButton Component

```typescript
interface ActionButtonProps {
  type: 'push' | 'tsuppari' | 'special';
  cooldown: number;          // 現在のクールダウン (ms)
  disabled: boolean;         // 無効化状態
  onPress: () => void;       // タップ時のコールバック
}

function ActionButton({
  type,
  cooldown,
  disabled,
  onPress
}: ActionButtonProps): JSX.Element {
  const [isPressed, setIsPressed] = useState(false);
  const progress = cooldown > 0 ? cooldown / getCooldownTime(type) : 0;

  return (
    <button
      className={`action-button action-button--${type}`}
      disabled={disabled || cooldown > 0}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => {
        setIsPressed(false);
        if (!disabled && cooldown === 0) onPress();
      }}
    >
      <ButtonIcon type={type} />
      {cooldown > 0 && (
        <CooldownOverlay progress={progress} />
      )}
      {isPressed && <RippleEffect />}
    </button>
  );
}
```

### ActionButtons Container

```typescript
interface ActionButtonsProps {
  cooldowns: Record<ActionType, number>;
  gaugeValue: number;
  onAction: (type: ActionType) => void;
}

function ActionButtons({
  cooldowns,
  gaugeValue,
  onAction
}: ActionButtonsProps): JSX.Element {
  const canUseSpecial = gaugeValue >= 100;

  return (
    <div className="action-buttons">
      <ActionButton
        type="push"
        cooldown={cooldowns.push}
        disabled={false}
        onPress={() => onAction('push')}
      />
      <ActionButton
        type="tsuppari"
        cooldown={cooldowns.tsuppari}
        disabled={false}
        onPress={() => onAction('tsuppari')}
      />
      <ActionButton
        type="special"
        cooldown={cooldowns.special}
        disabled={!canUseSpecial}
        onPress={() => onAction('special')}
      />
    </div>
  );
}
```

## デバッグ機能

### タッチ可視化

**開発モード限定**:

```typescript
if (import.meta.env.DEV) {
  // タッチ位置を可視化
  onTouchStart((e: TouchEvent) => {
    const touch = e.touches[0];
    this.showTouchIndicator(touch.clientX, touch.clientY);
  });
}
```

**表示内容**:

- タッチ位置に赤い円表示
- タッチ座標表示
- 検出されたボタン名表示

### 入力ログ

**コンソールログ出力**:

```typescript
logger.debug('Touch Input', {
  type: 'start',
  x: touch.clientX,
  y: touch.clientY,
  button: detectedButton?.type,
  timestamp: Date.now()
});
```

## パフォーマンス最適化

### イベント最適化

**スロットリング**:

- タッチムーブイベント: 16ms間隔（60fps）
- 理由: 不要な再描画を防ぐ

**パッシブリスナー**:

```typescript
element.addEventListener('touchstart', handler, {
  passive: true  // スクロールパフォーマンス向上
});
```

### レンダリング最適化

**React.memo使用**:

```typescript
export const ActionButton = React.memo(
  ActionButtonComponent,
  (prev, next) => {
    // 必要な場合のみ再レンダリング
    return (
      prev.cooldown === next.cooldown &&
      prev.disabled === next.disabled
    );
  }
);
```

**CSSアニメーション優先**:

- transform / opacity のみ使用（GPU加速）
- width / height の変更を避ける（リフロー防止）

## テスト戦略

### 単体テスト

**InputAdapterのテスト**:

```typescript
describe('InputAdapter', () => {
  it('should map touch to correct action', () => {
    const adapter = new InputAdapter(buttons);
    const touch = { clientX: 100, clientY: 500 };
    const action = adapter.mapTouchToAction(touch);

    expect(action?.type).toBe('push');
  });
});
```

### 統合テスト

**ボタンタップフローのテスト**:

```typescript
it('should execute action on button tap', async () => {
  const onAction = jest.fn();
  render(<ActionButtons onAction={onAction} />);

  const pushButton = screen.getByRole('button', { name: /push/i });
  fireEvent.touchStart(pushButton);
  fireEvent.touchEnd(pushButton);

  expect(onAction).toHaveBeenCalledWith('push');
});
```

### E2Eテスト

**実機テスト項目**:

- [ ] 各ボタンがタップに反応する
- [ ] クールダウン中はタップ不可
- [ ] ゲージ不足時スペシャル使用不可
- [ ] 視覚フィードバックが即座に表示される
- [ ] バイブレーションが動作する（対応端末）
- [ ] 誤タップが発生しにくい

## トラブルシューティング

### よくある問題

**問題: ボタンがタップに反応しない**

原因:
- z-indexが低い（他の要素に隠れている）
- pointer-events: none が設定されている
- タッチイベントが伝播していない

解決:

```css
.action-button {
  z-index: 1000;
  pointer-events: auto;
}
```

**問題: クールダウン表示が滑らかでない**

原因:
- 更新頻度が低い（100ms以上）
- CSSトランジションが重い

解決:

```typescript
// 60fps更新（16ms間隔）
const updateInterval = 16;
setInterval(() => {
  this.updateCooldowns(deltaTime);
}, updateInterval);
```

**問題: タップ位置がずれる**

原因:
- ブラウザのスクロールオフセット未考慮
- CSS transformによる位置ずれ

解決:

```typescript
function getTouchPosition(touch: Touch): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}
```

## まとめ

### 設計の要点（MVP）

1. **レトロデザイン**: 8bitカラーパレット、PixelMplusフォント、太い境界線
2. **シンプルな操作**: 3ボタンのみ
3. **明確なフィードバック**: 視覚・聴覚・触覚
4. **アクセシビリティ**: 大きなタッチターゲット
5. **パフォーマンス**: GPU加速アニメーション
6. **テスト可能性**: 抽象化レイヤーによる分離

### 拡張可能性

将来的な機能追加の余地:

- カスタムボタン配置（設定画面）
- ジェスチャー操作（スワイプなど）
- ゲームパッド対応（オプション）
- マルチタッチ対応（複数ボタン同時押し）

## 参考資料

- [Apple Human Interface Guidelines - Touch](https://developer.apple.com/design/human-interface-guidelines/ios/user-interaction/gestures/)
- [Material Design - Touch targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
