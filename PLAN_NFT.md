# 横綱NFT機能実装プラン

## 概要
横綱に昇進したプレイヤーに対して、Baseチェーン上でERC721 NFTを発行する機能を実装する。
NFTには取得順に「第○代横綱」と表示される。

## NFT仕様
- **画像**: sumoNFT.png（絵馬デザイン）
- **チェーン**: Base (L2)
- **規格**: ERC721
- **メタデータ**: 第○代横綱（ミント順で決定）

---

## 実装ステップ

### Phase 1: スマートコントラクト開発

#### 1.1 ERC721コントラクト作成
```
contracts/
└── YokozunaNFT.sol
```

**主要機能:**
- `mint(address to)`: 横綱NFTを発行（onlyOwner or verified）
- `totalMinted()`: 発行済み総数を返す（第○代の計算用）
- `tokenURI(uint256 tokenId)`: メタデータURI返却
- 各トークンに「第{tokenId}代横綱」のメタデータを持たせる

**考慮点:**
- ガスレスミント（Gasless/Relayer）の検討
- 1ウォレット1NFT制限の有無

#### 1.2 メタデータ設計
```json
{
  "name": "第{n}代横綱",
  "description": "相撲ゲームで横綱に昇進した証",
  "image": "ipfs://xxx/sumoNFT.png",
  "attributes": [
    {
      "trait_type": "Generation",
      "value": "{n}"
    },
    {
      "display_type": "date",
      "trait_type": "Achieved Date",
      "value": "{timestamp}"
    }
  ]
}
```

**オプション:**
- 動的SVG生成で「第○代」を画像内に埋め込む
- または静的画像 + メタデータのみで「第○代」を表示

---

### Phase 2: フロントエンド Web3統合

#### 2.1 必要なパッケージ追加
```bash
npm install wagmi viem @rainbow-me/rainbowkit
# または
npm install connectkit wagmi viem
```

#### 2.2 ウォレット接続機能
- `src/providers/Web3Provider.tsx`: Wagmi/RainbowKit設定
- Base チェーン設定

#### 2.3 NFTミント機能
- `src/hooks/useYokozunaNFT.ts`: NFTミント用カスタムフック
  - `mint()`: NFT発行トランザクション実行
  - `hasMinted(address)`: 既に取得済みか確認
  - `getGeneration()`: 現在の代数を取得

---

### Phase 3: ゲームロジック統合

#### 3.1 横綱昇進時のNFT発行フロー
`src/state/rankingStore.ts` を拡張:

```
横綱に昇進
    ↓
NFT取得モーダル表示
    ↓
ウォレット接続（未接続の場合）
    ↓
ミントトランザクション実行
    ↓
成功 → 「第○代横綱」表示
```

#### 3.2 UI/UXコンポーネント
- `src/components/screens/YokozunaNFTModal.tsx`: NFT取得モーダル
- `src/components/screens/NFTSuccessScreen.tsx`: 取得成功画面

---

### Phase 4: インフラ・デプロイ

#### 4.1 コントラクトデプロイ
- Base Sepolia（テストネット）でテスト
- Base Mainnetにデプロイ

#### 4.2 メタデータホスティング
- IPFS (Pinata/NFT.Storage) に画像アップロード
- メタデータJSON生成（オンチェーン or IPFS）

---

## 技術選択の検討事項

### A. ミント方式
| 方式 | メリット | デメリット |
|------|---------|-----------|
| ユーザー払い | シンプル | UX低下、離脱リスク |
| ガスレス（Relayer） | UX良好 | インフラコスト |
| Farcaster Frame | エコシステム統合 | 実装複雑 |

**推奨**: Farcaster mini-app連携しているので、Farcaster Framesまたはガスレスミント

### B. 第○代の表示方法
| 方式 | メリット | デメリット |
|------|---------|-----------|
| メタデータのみ | シンプル | マーケットプレイス依存 |
| 動的SVG | 画像に直接表示 | 実装複雑 |
| オンチェーンSVG | 完全オンチェーン | ガス高い |

**推奨**: メタデータ + 動的SVG（画像に「第○代」をオーバーレイ）

---

## ファイル構成（予定）

```
sumo_game/
├── contracts/
│   └── YokozunaNFT.sol          # スマートコントラクト
├── src/
│   ├── providers/
│   │   └── Web3Provider.tsx      # Wagmi設定
│   ├── hooks/
│   │   └── useYokozunaNFT.ts     # NFTミントフック
│   ├── components/
│   │   └── nft/
│   │       ├── YokozunaNFTModal.tsx    # ミントモーダル
│   │       ├── WalletConnectButton.tsx # ウォレット接続
│   │       └── NFTSuccessDisplay.tsx   # 成功表示
│   └── config/
│       └── wagmi.ts              # チェーン設定
├── public/
│   └── sumoNFT.png               # NFT画像
└── hardhat.config.ts             # コントラクトデプロイ設定
```

---

## 見積もり工数（目安）

1. **Phase 1**: スマートコントラクト開発
2. **Phase 2**: Web3フロントエンド統合
3. **Phase 3**: ゲームロジック統合
4. **Phase 4**: テスト・デプロイ

---

## 質問事項（決定が必要）

1. **ガス代負担**: ユーザー払い or プロジェクト負担（ガスレス）？
2. **1ウォレット制限**: 同じウォレットで複数回横綱になった場合、NFTは1つだけ or 毎回発行？
3. **動的SVG**: 画像に「第○代」を直接埋め込むか、メタデータのみか？
4. **Farcaster連携**: Farcaster Frame経由でミントするか？

---

## 次のアクション

1. 上記質問事項の確認
2. スマートコントラクト実装開始
3. テストネットデプロイ・動作確認
