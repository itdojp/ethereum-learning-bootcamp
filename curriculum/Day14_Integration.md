# Day14：総合演習 — L2デプロイ＋DApp＋サブグラフ統合

## 学習目的
- Optimism（または任意L2）への統合デプロイを行い、DApp・サブグラフ・モニタを接続する。
- トランザクション、イベント、UI、データ同期を一連で確認。
- チーム開発を想定した成果物管理・ドキュメント化を体験。

---

## 1. 全体構成
```
eth-bootcamp/
├── contracts/        # ERC20・NFT・Market
├── scripts/          # デプロイ／計測スクリプト
├── dapp/             # Reactフロント
├── subgraph/         # The Graphサブグラフ
├── .env              # RPC・鍵など
└── DEPLOYMENTS.md    # 成果ドキュメント
```

---

## 2. 手順概要
| フェーズ | 目的 | 主なツール |
|-----------|------|-------------|
| 1 | Optimismへのデプロイ | Hardhat |
| 2 | DApp接続 | React + ethers |
| 3 | イベント購読 | Provider.on / useEvents |
| 4 | The Graph構築 | graph-cli |
| 5 | 指標計測 | measure-fee.ts + metrics.csv |

---

## 3. フェーズ1：L2へ統合デプロイ

### 3.1 .env設定（例）
```
OPTIMISM_RPC_URL=https://optimism-mainnet.infura.io/v3/<KEY>
PRIVATE_KEY=0x<DEPLOYER>
ETHERSCAN_API_KEY=<OPTIMISTIC_SCAN_KEY>
```

### 3.2 コントラクトを順にデプロイ
```bash
# ERC20
CONTRACT=MyToken ARGS=1000000000000000000000000 \
  npx hardhat run scripts/deploy-generic.ts --network optimism

# NFT
CONTRACT=MyNFT ARGS="ipfs://<CID>/ <OWNER_ADDR> 500" \
  npx hardhat run scripts/deploy-generic.ts --network optimism

# Market
CONTRACT=FixedPriceMarket npx hardhat run scripts/deploy-generic.ts --network optimism
```
出力されたアドレスを控え、`DEPLOYMENTS.md`に追記。

### 3.3 Verify（任意）
```bash
npx hardhat verify --network optimism <TOKEN_ADDR> 1000000000000000000000000
```

---

## 4. フェーズ2：DApp統合

### 4.1 .env (dapp側)
```
VITE_CHAIN_ID=10
VITE_TOKEN_ADDRESS=0x...
VITE_MARKET_ADDRESS=0x...
VITE_RPC=https://optimism-mainnet.infura.io/v3/<KEY>
```

### 4.2 画面構成
| コンポーネント | 機能 |
|----------------|------|
| `ConnectWallet` | MetaMask接続、ネットワーク切替 |
| `Balances` | ETH・ERC20残高表示 |
| `Transfer` | トークン送金フォーム |
| `NFTView` | `tokenURI`読み込み、画像表示 |
| `MarketView` | 出品・購入ボタン |
| `Events` | 最新イベントリスト（Day10のuseEvents再利用） |

起動：
```bash
cd dapp
npm run dev
```
ブラウザで `http://localhost:5173` → Connect Wallet → 残高・NFT確認。

---

## 5. フェーズ3：イベント購読と可視化

`src/hooks/useEvents.ts`（Day10再利用）で `FixedPriceMarket` の `Listed` / `Purchased` イベントを購読。
```ts
const iface = new ethers.Interface([
  'event Listed(address indexed nft,uint256 indexed id,address indexed seller,uint256 price)',
  'event Purchased(address indexed nft,uint256 indexed id,address indexed buyer,uint256 price)'
]);
```
UIに最新10件を表示。

---

## 6. フェーズ4：The Graphサブグラフ（Market）

### 6.1 schema.graphql
```graphql
type Listing @entity {
  id: ID!
  nft: Bytes!
  tokenId: BigInt!
  seller: Bytes!
  price: BigInt!
  active: Boolean!
  createdAt: BigInt!
}

type Purchase @entity {
  id: ID!
  nft: Bytes!
  tokenId: BigInt!
  buyer: Bytes!
  price: BigInt!
  block: BigInt!
  txHash: Bytes!
}
```

### 6.2 mapping.ts
```ts
import { Listed, Purchased } from "../generated/FixedPriceMarket/FixedPriceMarket";
import { Listing, Purchase } from "../generated/schema";

export function handleListed(e: Listed): void {
  const id = e.transaction.hash.toHex()+'-'+e.logIndex.toString();
  const L = new Listing(id);
  L.nft = e.params.nft; L.tokenId = e.params.id; L.seller = e.params.seller;
  L.price = e.params.price; L.active = true; L.createdAt = e.block.timestamp;
  L.save();
}
export function handlePurchased(e: Purchased): void {
  const id = e.transaction.hash.toHex()+'-'+e.logIndex.toString();
  const P = new Purchase(id);
  P.nft = e.params.nft; P.tokenId = e.params.id; P.buyer = e.params.buyer;
  P.price = e.params.price; P.block = e.block.number; P.txHash = e.transaction.hash;
  P.save();
}
```

### 6.3 クエリ例
```graphql
{
  listings(first:5, orderBy: createdAt, orderDirection: desc){ nft tokenId seller price }
  purchases(first:5, orderBy: block, orderDirection: desc){ buyer price }
}
```

---

## 7. フェーズ5：指標収集
`measure-fee.ts`（Day8）を流用し、MainnetとOptimismで比較。`metrics.csv`に追記：
| network | txHash | gasUsed | feeEth | latencyMs |
|----------|---------|---------|--------|------------|

---

## 8. チェックリスト（統合確認）
- [ ] L2上でERC20/NFT/Marketが全て動作。
- [ ] DAppで残高、出品、購入が可視化。
- [ ] サブグラフにListing/Purchaseが反映。
- [ ] Etherscan Verify済。
- [ ] metrics.csvに手数料と遅延を記録。

---

## 9. 成果ドキュメント `DEPLOYMENTS.md` 更新例
```
## 2025-11-03 optimism Integration Test
- Token: 0xAAA
- NFT: 0xBBB
- Market: 0xCCC
- Subgraph: https://thegraph.com/studio/subgraph/fixedprice
- DApp: http://localhost:5173
- Avg fee: 0.00015 ETH (Optimism)
- Avg latency: 1.8s
- Verified ✅
```

---

## 10. 発展課題
- DAppで`TheGraph`のクエリ結果を表示し、**リアルタイム出品リスト**を構築。
- `permit`（EIP‑2612）を組み合わせてガスレス購入に対応。
- Optimism以外（Arbitrum/zkSync/Scroll）でも同手順で再現、差分を比較。

---

## 11. 提出物
- DApp稼働スクリーンショット（Connect Wallet → 出品 → 購入）。
- サブグラフのGraphQL結果例。
- `DEPLOYMENTS.md`最終版。

