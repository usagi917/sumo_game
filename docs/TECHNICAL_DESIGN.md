# 技術設計仕様

レトロ風紙相撲バトルゲームの技術的な実装詳細を説明します。

---

## 設計原則

### Ruthless Simplicity（徹底的なシンプルさ）

- 最小限の技術スタックで最大の効果
- 複雑な物理エンジンライブラリは使用しない
- Three.jsの基本機能で物理シミュレーション実装
- カスタムロジックで完全制御

### 技術選択の理由

**Three.js + カスタム物理**：
- ✅ バンドルサイズ削減（Cannon.js等の物理エンジン不要）
- ✅ 完全な制御（ゲームデザインに最適化）
- ✅ デバッグ容易（シンプルな数式）
- ✅ パフォーマンス最適化（必要な計算のみ）

**代替案との比較**：
- ❌ Cannon.js: ~200KB、オーバースペック
- ❌ Rapier: 高性能だが複雑すぎる
- ❌ Matter.js: 2D物理エンジン（3D不向き）

---

## 物理シミュレーション

### カスタム物理エンジン

**実装方針**：
- Three.jsのVector3/Eulerを活用
- 毎フレーム手動で物理計算
- シンプルな力学モデル

### 基本データ構造

```typescript
interface PhysicsState {
  // 位置・速度
  position: THREE.Vector3;     // 3D座標
  velocity: THREE.Vector3;     // 速度ベクトル
  acceleration: THREE.Vector3; // 加速度

  // 回転
  rotation: THREE.Euler;       // 回転角度（x: pitch, y: yaw, z: roll）
  angularVelocity: number;     // 角速度（rad/s）

  // 質量・力
  mass: number;                // 質量（固定: 1.0）
  forces: THREE.Vector3[];     // 適用される力のリスト

  // 転倒状態
  tipping: number;             // 傾き度合い（0-1）
  isFallen: boolean;           // 転倒済みフラグ
}
```

### 物理パラメータ

```typescript
const PhysicsConfig = {
  // 重力
  gravity: new THREE.Vector3(0, -9.8, 0),  // m/s²

  // 摩擦
  friction: 0.7,              // 土俵との摩擦係数
  airResistance: 0.95,        // 空気抵抗（速度減衰率）

  // 質量
  actorMass: 1.0,             // 力士の質量

  // 転倒
  tippingThreshold: Math.PI / 4,  // 45度（ラジアン）
  stabilizationRate: 0.98,    // 自動復元率（毎フレーム）

  // 土俵
  ringRadius: 4.5,            // 土俵半径
  ringFriction: 0.7,          // 土俵表面摩擦

  // タイムステップ
  fixedDeltaTime: 1/60,       // 60fps固定
};
```

### 力の適用システム

```typescript
class ForceSystem {
  private forces: THREE.Vector3[] = [];

  // 力を追加
  addForce(force: THREE.Vector3): void {
    this.forces.push(force.clone());
  }

  // 全ての力を合成
  getNetForce(): THREE.Vector3 {
    return this.forces.reduce(
      (sum, force) => sum.add(force),
      new THREE.Vector3()
    );
  }

  // 力をクリア（毎フレーム後）
  clear(): void {
    this.forces = [];
  }
}
```

### 物理更新ループ

```typescript
class PhysicsEngine {
  update(actor: PhysicsState, deltaTime: number): void {
    // 1. 力を合成
    const netForce = this.forceSystem.getNetForce();

    // 2. 加速度計算（F = ma → a = F/m）
    actor.acceleration = netForce.divideScalar(actor.mass);

    // 3. 重力を追加
    actor.acceleration.add(PhysicsConfig.gravity);

    // 4. 速度更新（v = v + a*dt）
    actor.velocity.add(
      actor.acceleration.clone().multiplyScalar(deltaTime)
    );

    // 5. 摩擦・空気抵抗
    actor.velocity.multiplyScalar(PhysicsConfig.airResistance);

    // 6. 位置更新（p = p + v*dt）
    actor.position.add(
      actor.velocity.clone().multiplyScalar(deltaTime)
    );

    // 7. 回転更新
    this.updateRotation(actor, deltaTime);

    // 8. 転倒判定
    this.checkTipping(actor);

    // 9. 土俵外判定
    this.checkRingOut(actor);

    // 10. 力をクリア
    this.forceSystem.clear();
  }
}
```

---

## 連打システム

### タップトラッキング

```typescript
class TapTracker {
  private taps: number[] = [];
  private readonly WINDOW = 1000; // 1秒間のウィンドウ

  // タップを記録
  addTap(timestamp: number = Date.now()): void {
    this.taps.push(timestamp);
    this.cleanup(timestamp);
  }

  // 古いタップを削除
  private cleanup(currentTime: number): void {
    const cutoff = currentTime - this.WINDOW;
    this.taps = this.taps.filter(t => t >= cutoff);
  }

  // 連打速度を取得（タップ/秒）
  getTapRate(): number {
    return this.taps.length;
  }

  // リセット
  reset(): void {
    this.taps = [];
  }
}
```

### 連打 → 力変換

```typescript
class TapForceConverter {
  // 強プッシュの力計算
  static strongPushForce(tapRate: number): THREE.Vector3 {
    const baseForce = 0.5;
    const multiplier = 1.5;
    const magnitude = baseForce + (tapRate * multiplier);

    // 前方向（z軸負方向）
    return new THREE.Vector3(0, 0, -magnitude);
  }

  // 弱プッシュの力計算
  static weakPushForce(tapRate: number): THREE.Vector3 {
    const baseForce = 0.3;
    const multiplier = 0.8;
    const magnitude = baseForce + (tapRate * multiplier);

    return new THREE.Vector3(0, 0, -magnitude);
  }

  // 傾き増加（強プッシュ）
  static strongTippingRate(tapRate: number): number {
    return tapRate * 0.01;
  }

  // 傾き増加（弱プッシュ）
  static weakTippingRate(tapRate: number): number {
    return tapRate * 0.003;
  }
}
```

---

## 転倒システム

### 転倒判定ロジック

```typescript
class TippingSystem {
  checkTipping(actor: PhysicsState): boolean {
    const threshold = PhysicsConfig.tippingThreshold;

    // 前傾チェック（x軸回転）
    if (actor.rotation.x > threshold) {
      actor.isFallen = true;
      actor.fallDirection = 'forward';
      return true;
    }

    // 後傾チェック
    if (actor.rotation.x < -threshold) {
      actor.isFallen = true;
      actor.fallDirection = 'backward';
      return true;
    }

    return false;
  }

  // 傾きを増加
  addTipping(actor: PhysicsState, amount: number): void {
    actor.rotation.x += amount;
    actor.tipping = Math.abs(actor.rotation.x) / PhysicsConfig.tippingThreshold;
  }

  // 自動復元（毎フレーム）
  stabilize(actor: PhysicsState): void {
    if (!actor.isFallen) {
      actor.rotation.x *= PhysicsConfig.stabilizationRate;
      actor.tipping *= PhysicsConfig.stabilizationRate;
    }
  }
}
```

### 重心計算

```typescript
class CenterOfGravitySystem {
  // 重心位置を計算
  calculateCOG(actor: PhysicsState): THREE.Vector3 {
    // シンプル実装：体の中心から少し下
    const cogOffset = new THREE.Vector3(0, -0.3, 0);
    return actor.position.clone().add(cogOffset);
  }

  // 支持基底面チェック
  isStable(cog: THREE.Vector3, basePosition: THREE.Vector3): boolean {
    // 重心が足元の範囲内にあるか
    const baseRadius = 0.2; // 足の半径
    const distance = new THREE.Vector2(
      cog.x - basePosition.x,
      cog.z - basePosition.z
    ).length();

    return distance <= baseRadius;
  }
}
```

---

## 衝突判定システム

### 距離ベース衝突

```typescript
class CollisionSystem {
  // 2つのアクター間の衝突チェック
  checkCollision(
    actor1: PhysicsState,
    actor2: PhysicsState
  ): boolean {
    const distance = actor1.position.distanceTo(actor2.position);
    const collisionThreshold = 1.0; // 合計半径

    return distance < collisionThreshold;
  }

  // 衝突応答（シンプルな弾性衝突）
  resolveCollision(
    actor1: PhysicsState,
    actor2: PhysicsState
  ): void {
    // 衝突法線ベクトル
    const normal = actor2.position.clone()
      .sub(actor1.position)
      .normalize();

    // 相対速度
    const relativeVelocity = actor1.velocity.clone()
      .sub(actor2.velocity);

    // 衝突速度
    const velocityAlongNormal = relativeVelocity.dot(normal);

    // 既に離れている場合は処理しない
    if (velocityAlongNormal > 0) return;

    // 反発係数
    const restitution = 0.5;

    // インパルス計算
    const impulse = -(1 + restitution) * velocityAlongNormal;
    const impulseMagnitude = impulse / (1/actor1.mass + 1/actor2.mass);

    // 速度を更新
    const impulseVector = normal.multiplyScalar(impulseMagnitude);
    actor1.velocity.add(impulseVector.clone().divideScalar(actor1.mass));
    actor2.velocity.sub(impulseVector.clone().divideScalar(actor2.mass));
  }
}
```

### 土俵外判定

```typescript
class RingOutSystem {
  checkRingOut(actor: PhysicsState): boolean {
    const distanceFromCenter = new THREE.Vector2(
      actor.position.x,
      actor.position.z
    ).length();

    return distanceFromCenter > PhysicsConfig.ringRadius;
  }
}
```

---

## AIシステム

### AI判断エンジン

```typescript
interface AIDecision {
  buttonType: 'strong' | 'weak';
  tapRate: number;  // タップ/秒
}

class AIEngine {
  private tapTracker: TapTracker;

  decide(
    self: PhysicsState,
    opponent: PhysicsState
  ): AIDecision {
    const distance = self.position.distanceTo(opponent.position);

    // 近距離：強プッシュで押し込む
    if (distance < 2.0) {
      return {
        buttonType: 'strong',
        tapRate: this.randomize(8, 12)
      };
    }

    // 自分が傾いている：安定化
    if (self.tipping > 0.6) {
      return {
        buttonType: 'weak',
        tapRate: this.randomize(4, 6)
      };
    }

    // 相手が不安定：攻める
    if (opponent.tipping > 0.5) {
      return {
        buttonType: 'strong',
        tapRate: this.randomize(10, 15)
      };
    }

    // デフォルト：弱プッシュで前進
    return {
      buttonType: 'weak',
      tapRate: this.randomize(5, 8)
    };
  }

  // ランダム性を追加（±20%）
  private randomize(min: number, max: number): number {
    const base = (min + max) / 2;
    const variance = (max - min) / 2 * 0.2;
    return base + (Math.random() - 0.5) * variance * 2;
  }

  // AIの連打をシミュレート
  simulateTapping(decision: AIDecision, deltaTime: number): void {
    // decision.tapRateに基づいて確率的にタップ
    const tapProbability = decision.tapRate * deltaTime;
    if (Math.random() < tapProbability) {
      this.tapTracker.addTap();
    }
  }
}
```

---

## レンダリングシステム

### メインゲームループ

```typescript
class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private readonly FIXED_DELTA = 1/60;  // 60fps固定

  update(currentTime: number): void {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 可変フレームレート対応
    this.accumulator += deltaTime;

    // 固定タイムステップで物理更新
    while (this.accumulator >= this.FIXED_DELTA) {
      this.physicsEngine.update(this.FIXED_DELTA);
      this.accumulator -= this.FIXED_DELTA;
    }

    // レンダリング（毎フレーム）
    this.render();

    // 次フレーム
    requestAnimationFrame(this.update.bind(this));
  }
}
```

### Three.js統合

```typescript
class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  initialize(): void {
    // シーン作成
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f380f); // レトロ背景

    // カメラ設定（斜め上から）
    this.camera = new THREE.PerspectiveCamera(
      45,  // FOV
      window.innerWidth / window.innerHeight,  // アスペクト比
      0.1,  // Near
      1000  // Far
    );
    this.camera.position.set(0, 10, 12);
    this.camera.lookAt(0, 0, 0);

    // レンダラー設定
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,  // レトロ感のためアンチエイリアスなし
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // ライティング（シンプル）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

---

## パフォーマンス最適化

### バンドルサイズ最適化

**目標**: 1.5MB以下

**達成方法**：
- ✅ 物理エンジンライブラリ不使用（~200KB削減）
- ✅ カスタム物理実装（~5KB追加）
- ✅ Three.js最小限の機能のみ
- ✅ Tree-shaking有効

### メモリ管理

```typescript
class ObjectPool<T> {
  private pool: T[] = [];

  acquire(factory: () => T): T {
    return this.pool.pop() || factory();
  }

  release(obj: T): void {
    this.pool.push(obj);
  }
}

// Vector3オブジェクトプール
const vector3Pool = new ObjectPool<THREE.Vector3>();
```

### フレームレート維持

**目標**: 30fps以上（モバイル）

**最適化**：
- 固定タイムステップ（60fps物理）
- 可変フレームレート対応
- 不要なレンダリングスキップ
- シンプルなジオメトリ（低ポリゴン）

---

## デバッグ機能

### 物理デバッグ表示

```typescript
class PhysicsDebugger {
  private helpers: THREE.Object3D[] = [];

  // 力ベクトルを可視化
  showForces(actor: PhysicsState, forces: THREE.Vector3[]): void {
    forces.forEach(force => {
      const arrow = new THREE.ArrowHelper(
        force.clone().normalize(),
        actor.position,
        force.length(),
        0xff0000
      );
      this.helpers.push(arrow);
      this.scene.add(arrow);
    });
  }

  // 重心を可視化
  showCenterOfGravity(cog: THREE.Vector3): void {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    sphere.position.copy(cog);
    this.helpers.push(sphere);
    this.scene.add(sphere);
  }

  // デバッグ表示をクリア
  clear(): void {
    this.helpers.forEach(h => this.scene.remove(h));
    this.helpers = [];
  }
}
```

### パフォーマンスモニター

```typescript
class PerformanceMonitor {
  private frames = 0;
  private lastTime = performance.now();

  update(): void {
    this.frames++;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      const fps = Math.round(this.frames * 1000 / (currentTime - this.lastTime));
      console.log(`FPS: ${fps}`);

      this.frames = 0;
      this.lastTime = currentTime;
    }
  }
}
```

---

## テスト戦略

### ユニットテスト

**物理計算のテスト**：

```typescript
describe('PhysicsEngine', () => {
  it('should apply gravity correctly', () => {
    const actor = createTestActor();
    const engine = new PhysicsEngine();

    engine.update(actor, 1.0); // 1秒後

    // y座標が下がっているはず（重力の影響）
    expect(actor.position.y).toBeLessThan(0);
  });

  it('should stop at friction', () => {
    const actor = createTestActor();
    actor.velocity.set(10, 0, 0);

    // 摩擦で減速
    for (let i = 0; i < 100; i++) {
      engine.update(actor, 0.016); // 60fps
    }

    // ほぼ停止しているはず
    expect(actor.velocity.length()).toBeLessThan(0.1);
  });
});
```

### 統合テスト

**ゲームフロー全体のテスト**：

```typescript
describe('Game Flow', () => {
  it('should detect ring out', () => {
    const game = new Game();
    game.player.position.set(10, 0, 0); // 土俵外

    game.update(0.016);

    expect(game.isGameOver()).toBe(true);
    expect(game.winner).toBe('opponent');
  });

  it('should detect tipping', () => {
    const game = new Game();
    game.player.rotation.x = Math.PI / 3; // 60度傾き

    game.update(0.016);

    expect(game.isGameOver()).toBe(true);
    expect(game.winner).toBe('opponent');
  });
});
```

---

## セキュリティ考慮事項

### クライアントサイドのみ

MVPでは完全にクライアントサイド実行：
- サーバー不要
- localStorageで設定保存のみ
- 機密情報なし

**将来拡張**（オンライン対戦時）：
- サーバーサイド物理検証
- チート対策（クライアント検証のみでは不十分）

---

## 開発環境

### 必要なツール

- Node.js 18以上
- TypeScript 5.0以上
- Vite 5.0以上
- Three.js r150以上

### ビルド設定

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2019',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true  // 本番ビルドでconsoleを削除
      }
    }
  }
});
```

---

## 参考資料

**物理シミュレーション**：
- [Game Physics Engine Development](https://www.amazon.com/dp/0123819768)
- [Three.js Documentation](https://threejs.org/docs/)

**ゲームループ**：
- [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)

**パフォーマンス**：
- [Web Performance Working Group](https://www.w3.org/webperf/)
