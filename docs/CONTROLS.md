# 操作システム仕様

レトロ風トントン相撲バトルゲームの操作システムとUIインタラクションを説明します。

## 設計原則

### モバイルファースト

- タッチ操作専用設計
- 大型連打ボタン（最低100×100px）
- 最小タッチターゲット: 100×100px（連打しやすさ重視）
- 誤タップ防止の配慮

### 極限までシンプルな操作

- ボタン1つのみ（「トン！」連打ボタン）
- 複雑なジェスチャー不要
- 画面下部中央に大きく配置
- 連打速度とリズムで戦略性を持たせる

## 入力システム

### トン！ボタンシステム

```typescript
interface TontonButtonProps {
  disabled: boolean;       // ゲーム停止中など
  onTap: () => void;       // タップ時のコールバック
}
```

**イベントフロー**:

```
Button Tap
    ↓
物理エンジンに力を加える
    ├→ velocity.z += TAP_FORCE (前方へ)
    ├→ velocity.y += TAP_BOUNCE (上方へ)
    └→ angularVelocity += random(-0.1, 0.1) (揺れ)
        ↓
物理演算で力士が動く
    ├→ 重力適用 (velocity.y -= GRAVITY * dt)
    ├→ 位置更新 (position += velocity * dt)
    ├→ 減衰適用 (velocity *= DAMPING)
    └→ 回転更新 (rotation.x += angularVelocity * dt)
        ↓
勝敗判定
    ├→ 土俵外判定 (distance > RING_RADIUS)
    └→ 転倒判定 (rotation.x > FALL_ANGLE)
```

### タップ処理フロー

```typescript
// TontonControls.tsx から
function handleTap() {
  // ゲーム停止中は実行しない
  if (gameState !== 'playing') return;

  // 物理エンジンに力を加える
  applyTapForce(playerFighter, {
    forward: TAP_FORCE,    // 2.0 N
    upward: TAP_BOUNCE,    // 0.5 N
    rotation: random(-0.1, 0.1)  // ランダムな揺れ
  });

  // 視覚フィードバック
  playTapAnimation();

  // サウンド/触覚フィードバック（optional）
  playTapSound();
  vibrate(10);  // 軽い振動
}
```

## トン！ボタン

### ボタン仕様（レトロスタイル）

**単一の大型連打ボタン**:

#### トン！ボタン

- **ラベル**: 「トン！」（M PLUS 1フォント、大きく明瞭）
- **色**: ベース色（#f4e4c1 - まわしクリーム）
- **配置**: 画面下部中央
- **サイズ**: 最低100×100px（連打しやすさ重視）
- **動作**:
  - タップごとに物理エンジンに力を加える
  - 前方力: 2.0 N
  - 上方力: 0.5 N
  - 微小な揺れ: ±0.1 rad/s（ランダム）
- **特徴**: 連打速度とリズムで戦略性

**レトロデザイン特徴**:
- 太い境界線（6px、存在感重視）
- M PLUS 1フォント使用（日本語対応、レトロ風）
- 特大ラベル（24px以上）
- タップ時に即座にスケール変化

### ボタン配置

```
画面レイアウト:

┌────────────────────────┐
│  試合ステータス         │ ← HUD（タイマー、プレイヤー名など）
├────────────────────────┤
│                        │
│      ゲーム画面         │
│     (3D土俵シーン)      │
│   物理演算で力士が動く   │
│                        │
└────────────────────────┘
│       [トン！]         │ ← 大型連打ボタン（中央配置）
└────────────────────────┘
```

**配置仕様**:

- 画面下部中央に固定
- ボタン1つのみ
- 親指が届く範囲（画面下から20%以内）
- サイズ: 最低100×100px（連打を考慮）

### ボタンサイズ

```typescript
const tontonButtonSpec = {
  width: 120,           // px（横幅）
  height: 120,          // px（高さ）
  borderRadius: 12,     // 角丸（大きめ）
  touchTarget: 100,     // 最小タッチサイズ（連打重視）
  fontSize: 24,         // フォントサイズ（大きく明瞭）
};
```

**タッチターゲット**:

- 最小サイズ: 100×100px（連打しやすさ重視）
- 実際のボタンサイズ: 120×120px
- 理由: 連打時のタップ精度向上、疲労軽減

### レトロボタンスタイリング

相撲テーマのレトロな大型ボタンデザインを採用します。

**CSS実装例**:

```css
.tonton-button {
  /* 基本スタイル */
  font-family: 'M PLUS 1', sans-serif;
  border: 6px solid var(--retro-dark);  /* #1a0f08 */
  background: var(--retro-fg);  /* #f4e4c1 - まわしクリーム */
  color: var(--retro-bg);  /* #3d2817 */
  font-size: 24px;
  font-weight: bold;
  width: 120px;
  height: 120px;
  cursor: pointer;

  /* 円形ボタン */
  border-radius: 12px;

  /* 中央配置 */
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);

  /* ユーザー選択無効化（連続タップ時のテキスト選択防止） */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;

  /* タップエフェクト準備 */
  transition: transform 0.05s ease-out;
}

/* タップ時の視覚フィードバック */
.tonton-button:active {
  transform: translateX(-50%) scale(0.9);
  filter: brightness(1.2);
}

/* リップルエフェクト（タップ位置） */
.tonton-button::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border-radius: 12px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%);
  opacity: 0;
  pointer-events: none;
}

.tonton-button.tap-effect::after {
  animation: ripple 0.3s ease-out;
}

@keyframes ripple {
  0% {
    opacity: 1;
    transform: scale(0);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

/* 無効状態（ゲーム停止中） */
.tonton-button:disabled {
  background: var(--retro-dark);
  color: var(--retro-bg);
  opacity: 0.5;
  cursor: not-allowed;
}
```

**レトロカラーパレット**（相撲テーマ）:

```css
:root {
  --retro-bg: #3d2817;      /* 土俵の土色（dohyo earth brown） */
  --retro-fg: #f4e4c1;      /* まわしのクリーム色（mawashi cream） */
  --retro-accent: #8b4513;  /* 茶色まわし（brown mawashi） */
  --retro-dark: #1a0f08;    /* 深い土色（deep earth） */
  --action-highlight: #ffd700;  /* アクションハイライト（ゴールド） */
}
```

## 連打戦略

### 連打速度とリズム

トントン相撲では、クールダウンやゲージの概念は存在しません。代わりに、連打速度とリズムが戦略の鍵となります。

**連打パターン**:

```typescript
// 連打速度による効果の違い
const TAP_STRATEGIES = {
  FAST:   { interval: 100, effect: '安定前進、揺れ少' },
  MEDIUM: { interval: 250, effect: 'バランス型' },
  SLOW:   { interval: 500, effect: '大きな跳ね、転倒リスク' },
};
```

**戦略的使用**:

1. **速い連打（100ms間隔）**:
   - 安定した前進
   - 揺れが少なく転倒しにくい
   - 相手を押し込む時に有効

2. **リズミカルな連打（250ms間隔）**:
   - バランスの取れた動き
   - 適度な跳ねと前進
   - 距離を詰める時に有効

3. **遅い連打（500ms間隔）**:
   - 大きな跳ね上がり
   - タイミング調整
   - 転倒リスクが増えるが強力

### コンボ例

```
速い連打（3回） → 一時停止（力士が落ち着く） → 速い連打（3回）
→ 安定して前進、相手を土俵際まで追い込む
```

## 視覚フィードバック

### タップフィードバック

**即座の応答**:

1. **視覚**: ボタンのスケール変化（scale(0.9)、即座）+ リップルエフェクト
2. **物理**: 力士が跳ね上がる（物理演算による自然な動き）
3. **サウンド**: タップ音再生（オプション）
4. **触覚**: 軽いバイブレーション（10ms、対応デバイス）

**実装**:

```typescript
function handleTap() {
  // ゲーム停止中は実行しない
  if (gameState !== 'playing') return;

  // 物理エンジンに力を加える
  applyTapForce(playerFighter, {
    forward: TAP_FORCE,    // 2.0 N
    upward: TAP_BOUNCE,    // 0.5 N
    rotation: random(-0.1, 0.1)
  });

  // リップルエフェクト
  button.classList.add('tap-effect');
  setTimeout(() => button.classList.remove('tap-effect'), 300);

  // サウンドフィードバック（オプション）
  if (soundEnabled) {
    playSound('tap');
  }

  // 触覚フィードバック
  if (navigator.vibrate) {
    navigator.vibrate(10);  // 軽い振動
  }
}
```

### 物理演算フィードバック

**力士の動きによるフィードバック**:

```typescript
// タップ後、力士の動きで連打効果を視覚的に確認
// - 力士が跳ね上がる（velocity.y > 0）
// - 前方へ移動する（velocity.z > 0）
// - 微小に揺れる（rotation.x が変化）

// これらはすべて物理演算により自動的に表現される
```

## アクセシビリティ

### タッチターゲットサイズ

**連打しやすさ重視**:

- 最小サイズ: 100×100px（Apple HIG 44×44pxを大きく超える）
- 実装: 120×120px（余裕を持たせる）
- 理由: 連打時のタップ精度向上、疲労軽減

**ボタン配置**:

- 画面下部中央（左右の手でもアクセス可能）
- 周囲に十分な余白（誤タップ防止）

### 視覚フィードバック

**明確なフィードバック**:

- タップ時の即座なスケール変化
- リップルエフェクトでタップ位置を視覚化
- 力士の物理的な動き（連打効果の確認）

**コントラスト**:

- ボタン背景と画面背景: 4.5:1以上
- ラベルとボタン背景: 4.5:1以上

### 触覚フィードバック

**バイブレーション対応**:

```typescript
const vibrationPatterns = {
  tap: 10,                       // タップ（軽い振動）
  collision: 20,                 // 力士衝突（中程度）
  fall: 50,                      // 転倒（強い振動）
  ringOut: [30, 10, 30],         // 場外（パターン）
  victory: [50, 20, 50, 20, 100] // 勝利（複雑なパターン）
};
```

### レスポンシブ対応

**画面サイズ別調整**:

```typescript
// 小画面（iPhone SE）
if (screenWidth < 375) {
  buttonHeight = 50;   // 少し小さく
  fontSize = 14;
}

// 大画面（iPad）
if (screenWidth > 768) {
  buttonHeight = 80;   // 大きく
  fontSize = 20;
}
```

## UIコンポーネント構造

### TontonButton Component

```typescript
interface TontonButtonProps {
  disabled: boolean;       // ゲーム停止中など
  onTap: () => void;       // タップ時のコールバック
}

function TontonButton({
  disabled,
  onTap
}: TontonButtonProps) {
  const [tapEffect, setTapEffect] = useState(false);

  const handleTap = () => {
    if (disabled) return;

    // タップ処理
    onTap();

    // リップルエフェクト
    setTapEffect(true);
    setTimeout(() => setTapEffect(false), 300);
  };

  return (
    <button
      className={`
        tonton-button
        ${tapEffect ? 'tap-effect' : ''}
      `}
      disabled={disabled}
      onClick={handleTap}
    >
      トン！
    </button>
  );
}
```

### HUD Component

```typescript
function HUD({
  matchStatus,
  playerName,
  opponentName
}: HUDProps) {
  return (
    <div className="hud">
      <div className="hud-top">
        {/* 試合ステータス */}
        <div className="match-status">
          {matchStatus}
        </div>

        {/* プレイヤー名表示（optional） */}
        <div className="player-names">
          <span className="player-name">{playerName}</span>
          <span className="vs-text">vs</span>
          <span className="opponent-name">{opponentName}</span>
        </div>
      </div>
    </div>
  );
}
```

## パフォーマンス最適化

### イベント最適化

**パッシブリスナー**:

```typescript
element.addEventListener('touchstart', handler, {
  passive: true  // スクロールパフォーマンス向上
});
```

### レンダリング最適化

**React.memo使用**:

```typescript
export const TontonButton = React.memo(
  TontonButtonComponent,
  (prev, next) => {
    return prev.disabled === next.disabled;
  }
);
```

**CSSアニメーション優先**:

- transform / opacity のみ使用（GPU加速）
- width / height の変更を避ける（リフロー防止）
- transition無効化（:active時の即座の反応）

## デバッグ機能

### 物理状態の可視化

**開発モード限定**:

```typescript
if (import.meta.env.DEV) {
  // 物理状態表示
  const debugDisplay = document.createElement('div');
  debugDisplay.className = 'physics-debug';
  debugDisplay.innerHTML = `
    <div>Velocity: ${velocity.toFixed(2)} m/s</div>
    <div>Angular Velocity: ${angularVelocity.toFixed(2)} rad/s</div>
    <div>Rotation: ${rotation.toFixed(2)}°</div>
    <div>Position: (${position.x.toFixed(2)}, ${position.z.toFixed(2)})</div>
  `;
}
```

## テスト戦略

### 単体テスト

**物理シミュレーションのテスト**:

```typescript
describe('Tonton Physics', () => {
  it('should apply force on tap', () => {
    const initialVelocity = fighter.velocity.clone();
    executeTap();
    expect(fighter.velocity.z).toBeGreaterThan(initialVelocity.z);
    expect(fighter.velocity.y).toBeGreaterThan(initialVelocity.y);
  });

  it('should apply damping over time', () => {
    fighter.velocity.set(0, 0, 10);
    updatePhysics(1.0);  // 1秒経過
    expect(fighter.velocity.z).toBeLessThan(10);
  });

  it('should detect fall at 60 degrees', () => {
    fighter.rotation.x = Math.PI / 3;  // 60度
    fighter.angularVelocity = 0.6;
    const hasFallen = checkFallCondition(fighter);
    expect(hasFallen).toBe(true);
  });
});
```

### 統合テスト

**トントンボタンフローのテスト**:

```typescript
it('should execute tap on button click', async () => {
  const { getByText } = render(<GameUI />);

  const tontonButton = getByText('トン！');
  const initialVelocity = getFighterVelocity();

  fireEvent.click(tontonButton);

  // タップで力が加わったか確認
  expect(getFighterVelocity()).toBeGreaterThan(initialVelocity);
});

it('should apply ripple effect on tap', async () => {
  const { getByText } = render(<GameUI />);

  const tontonButton = getByText('トン！');
  fireEvent.click(tontonButton);

  // リップルエフェクトが表示されるか確認
  expect(tontonButton).toHaveClass('tonton-button--active');
});
```

### E2Eテスト

**実機テスト項目**:

- [ ] トントンボタンがタップに反応する
- [ ] 連打により力士が前進する
- [ ] 物理演算が自然な動きを生成する
- [ ] 視覚フィードバック（リップル）が即座に表示される
- [ ] バイブレーションが動作する（対応端末）
- [ ] 転倒判定が正確に動作する（60度閾値）
- [ ] 土俵外判定が正確に動作する（4.5ユニット超）

## トラブルシューティング

### よくある問題

**問題: ボタンがタップに反応しない**

原因:
- 試合が停止中（disabled=true）
- イベントリスナーが登録されていない

解決:
```typescript
// ボタンの状態を確認
console.log('Disabled:', button.disabled);
console.log('Match Status:', matchStatus);

// イベントリスナーを確認
button.addEventListener('click', () => {
  console.log('Button clicked');
});
```

**問題: 力士が動かない**

原因:
- 物理更新ループが動作していない
- TAP_FORCEが小さすぎる

解決:
```typescript
// 物理更新を確認
useFrame((state, delta) => {
  console.log('Physics update:', delta);
  updatePhysics(delta);
});

// 物理定数を確認
console.log('TAP_FORCE:', TAP_FORCE);
console.log('Velocity:', fighter.velocity);
```

**問題: 転倒判定が動作しない**

原因:
- FALL_ANGLEが正しく設定されていない
- 角速度が閾値未満

解決:
```typescript
// 転倒条件を確認
console.log('Rotation:', Math.abs(fighter.rotation.x), '/ FALL_ANGLE:', FALL_ANGLE);
console.log('Angular Velocity:', Math.abs(fighter.angularVelocity), '/ MIN:', MIN_FALL_VELOCITY);

// 条件を満たしているか確認
if (Math.abs(fighter.rotation.x) > FALL_ANGLE && Math.abs(fighter.angularVelocity) > MIN_FALL_VELOCITY) {
  console.log('Fall condition met!');
}
```

## まとめ

### 設計の要点

1. **相撲テーマのレトロデザイン**: 土俵色カラーパレット、M PLUS 1フォント
2. **極限までシンプルな操作**: ボタン1つのみ（「トン！」連打）
3. **物理シミュレーション**: 連打で振動発生、重力・慣性・減衰で自然な動き
4. **大型ボタン**: 100×100px以上（連打しやすさ重視）
5. **明確なフィードバック**: 視覚（リップル）・物理（力士の動き）・聴覚・触覚
6. **アクセシビリティ**: 100px以上のタッチターゲット、明確なラベル
7. **パフォーマンス**: GPU加速アニメーション、軽量な物理演算（~100行）

### 戦略性

**基本戦略**:
- 速い連打で安定前進
- リズミカルな連打でバランス型
- 遅い連打で大きな跳ね（リスク高）

**状況別戦略**:
- 相手を押し込む: 速い連打で安定前進
- 距離を詰める: リズミカルな連打
- 相手が転倒しそう: 一気に押し込む連打
- 自分が転倒しそう: 一時停止で力士を落ち着かせる

## 参考資料

- [Apple Human Interface Guidelines - Touch](https://developer.apple.com/design/human-interface-guidelines/ios/user-interaction/gestures/)
- [Material Design - Touch targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
