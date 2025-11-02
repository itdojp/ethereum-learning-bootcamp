# Day8：L2ロールアップ（Optimistic vs ZK）とDencun/Blob実測

## 学習目的
- Optimistic Rollup と ZK Rollup の仕組み差（証明、引出し、最終性）を理解する。
- Dencun（EIP‑4844 Blob）の要点を押さえ、L2手数料の実測を行う。
- 既存コントラクトをL2（Optimism, 任意でzkEVM/zkSync）にデプロイし、手数料・確定時間を比較する。

---

## 1. 理論解説（教科書）

### 1.1 ロールアップの基本
- **Optimistic Rollup**：L2は“正しい”と**楽観**し、一定のチャレンジ期間で不正を指摘可能（fraud proof）。引出しに数分〜数日かかる設計が一般的。
- **ZK Rollup**：L2のバッチに**有効性証明（validity proof）**を添付。L1検証が通れば即時確定に近い。実装は高難度。

### 1.2 データ可用性（DA）と手数料
- L2のトランザクションデータは**L1に投稿**される（calldataやblob等）。
- L1の**データ可用性コスト**がL2手数料のボトルネックになりやすい。

### 1.3 Dencun（EIP‑4844：Proto‑Danksharding / Blob）
- L2データを**Blob**として一時的にL1へ格納。calldataより安価。
- Blobは数週間で**非可用化**されるが、DA要件は満たす。結果としてL2手数料が大幅に低減。

### 1.4 比較観点
| 観点 | Optimistic | ZK |
|---|---|---|
| セキュリティ | fraud proof | validity proof |
| 引出し時間 | 長め | 短い/即時に近い |
| 実装難易度 | 低〜中 | 高 |
| 手数料 | 低（Blobでさらに低減） | 低（計算コストや証明生成が影響） |

---

## 2. ハンズオン：L2追加と再デプロイ

### 2.1 HardhatにL2を追加
`hardhat.config.ts`
```ts
networks: {
  sepolia: { url: process.env.SEPOLIA_RPC_URL!, accounts: [process.env.PRIVATE_KEY!] },
  optimism: { url: process.env.OPTIMISM_RPC_URL!, accounts: [process.env.PRIVATE_KEY!] },
  // 任意：Polygon zkEVM, zkSync（Hardhatプラグインや設定がチェーン毎に異なる）
  // polygonZk: { url: process.env.POLYGON_ZKEVM_RPC_URL!, accounts: [process.env.PRIVATE_KEY!] },
}
```
`.env.sample`
```
OPTIMISM_RPC_URL=
POLYGON_ZKEVM_RPC_URL=
```

### 2.2 既存ERC‑20の再デプロイ
```bash
CONTRACT=MyToken ARGS=1000000000000000000000 \
  npx hardhat run scripts/deploy-generic.ts --network optimism
```
出力されたアドレスを控える。

### 2.3 Verify（可能な場合）
```bash
npx hardhat verify --network optimism <DEPLOYED_ADDR> 1000000000000000000000
```

---

## 3. 実測：手数料・確定時間を取る

### 3.1 スクリプトで送金と計測
`scripts/measure-fee.ts`
```ts
import { ethers } from "hardhat";
async function main(){
  const net = await ethers.provider.getNetwork();
  const [a,b] = await ethers.getSigners();
  const start = Date.now();
  const tx = await a.sendTransaction({ to: b.address, value: ethers.utils.parseEther("0.0001") });
  const rec = await tx.wait();
  const end = Date.now();
  const used = rec.gasUsed;
  const price = (rec.effectiveGasPrice||ethers.constants.Zero);
  const feeWei = used.mul(price);
  console.log(JSON.stringify({
    network: net.name,
    chainId: net.chainId,
    txHash: tx.hash,
    gasUsed: used.toString(),
    effGasPriceWei: price.toString(),
    feeEth: ethers.utils.formatEther(feeWei),
    latencyMs: end - start
  }, null, 2));
}
main().catch(e=>{console.error(e);process.exit(1)});
```
実行：
```bash
# L1 or Sepolia
npx hardhat run scripts/measure-fee.ts --network sepolia
# Optimism
npx hardhat run scripts/measure-fee.ts --network optimism
```
**出力**の`feeEth`と`latencyMs`を表に記録。

### 3.2 コントラクト関数の計測
`scripts/measure-contract.ts`
```ts
import { ethers } from "hardhat";
const TOKEN = process.env.TOKEN!; // L2にデプロイしたERC20
async function main(){
  const net = await ethers.provider.getNetwork();
  const [owner, bob] = await ethers.getSigners();
  const abi=["function transfer(address,uint256) returns(bool)","function balanceOf(address) view returns(uint)"];
  const c = new ethers.Contract(TOKEN, abi, owner);
  const start = Date.now();
  const tx = await c.transfer(bob.address, ethers.utils.parseEther("0.01"));
  const rec = await tx.wait();
  const end = Date.now();
  const fee = rec.gasUsed.mul(rec.effectiveGasPrice||0);
  console.log(JSON.stringify({
    network: net.name,
    txHash: tx.hash,
    gasUsed: rec.gasUsed.toString(),
    feeEth: ethers.utils.formatEther(fee),
    latencyMs: end-start
  }, null, 2));
}
main().catch(console.error);
```
```bash
TOKEN=0x... npx hardhat run scripts/measure-contract.ts --network optimism
```

### 3.3 CSV出力（任意）
`tools/to-csv.sh`
```bash
#!/usr/bin/env bash
jq -r '[.network,.txHash,.gasUsed,.feeEth,.latencyMs] | @csv'
```
使用例：
```bash
npx hardhat run scripts/measure-fee.ts --network optimism | tee /tmp/op.json
cat /tmp/op.json | tools/to-csv.sh >> metrics.csv
```

---

## 4. L2ブリッジ（概要）
- L1→L2入金（deposit）とL2→L1引出し（withdraw）は、**公式ブリッジ**またはサードパーティブリッジを利用。
- Optimisticは**引出しに時間**がかかる。運用上は**流動性ブリッジ**も検討。
- セキュリティ上、公式ブリッジのコントラクトと多署名管理を確認。

---

## 5. 評価観点とドキュメント
- `metrics.csv` に **feeEth** と **latencyMs** を時刻つきで蓄積。
- `DEPLOYMENTS.md` に L2デプロイ・Verify・ブリッジ手順の要約を追記。
- 差分が大きいときは、**RPCベンダ**や**Blob可用状況**を確認。

---

## 6. トラブルシュート
| 症状 | 原因 | 対策 |
|---|---|---|
| `insufficient funds` | L2で手数料不足 | L2のETHをブリッジまたは取引所から供給 |
| Verify失敗 | コンパイラ設定差分 | `hardhat.config.ts` の `solidity` を一致させる |
| 異常な`latencyMs` | RPC遅延/混雑 | 別RPCで再測、再試行、バッチ間隔を変える |

---

## 7. 提出物
- `measure-fee.ts` と `measure-contract.ts` の実行JSONと `metrics.csv`。
- Optimism（任意でzkEVM）でのデプロイアドレス、Verifyリンク。
- ブリッジで得たL2残高のスクリーンショット（鍵・残高は秘匿）。

