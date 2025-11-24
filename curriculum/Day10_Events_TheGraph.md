# Day10：イベント購読とThe Graph（サブグラフ）

## 学習目的
- Solidityイベントの`indexed`設計と購読方法を理解。
- ブラウザからリアルタイム購読（ethers）。
- The Graphで履歴データをインデックス化し、GraphQLで取得。

---

## 1. 理論解説（教科書）

### 1.1 イベントの役割
- オンチェーン状態を直接列挙するのはコスト高。**イベントログ**を使うとオフチェーンで効率取得。
- `indexed` を付けた引数は**topic**になり、フィルタが高速。

### 1.2 設計指針
- 検索キーは `indexed`。多すぎるとtopicが増え非効率。
- イベント名と引数は**安定**させる。将来互換性を考慮。

---

## 2. ハンズオンA：イベント発火コントラクト

`contracts/EventToken.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EventToken {
    mapping(address=>uint256) public bal;
    event TransferLogged(address indexed from, address indexed to, uint256 amount);

    function mint(uint256 a) external { bal[msg.sender]+=a; }
    function transfer(address to, uint256 a) external {
        require(bal[msg.sender] >= a, "bal");
        bal[msg.sender]-=a; bal[to]+=a;
        emit TransferLogged(msg.sender, to, a);
    }
}
```

**デプロイ**
```bash
npx hardhat run scripts/deploy-event-token.ts --network sepolia
```
`scripts/deploy-event-token.ts`
```ts
import { ethers } from "hardhat";
async function main(){
  const F = await ethers.getContractFactory("EventToken");
  const c = await F.deploy();
  await c.waitForDeployment();
  console.log("EventToken:", await c.getAddress());
}
main().catch(e=>{console.error(e);process.exit(1)});
```

**動作**
```ts
// scripts/use-event-token.ts
import { ethers } from "hardhat";
const ADDR = process.env.EVT!;
async function main(){
  const [a,b] = await ethers.getSigners();
  const abi=[
    "function mint(uint256)",
    "function transfer(address,uint256)",
    "event TransferLogged(address indexed,address indexed,uint256)"
  ];
  const c = new ethers.Contract(ADDR, abi, a);
  await (await c.mint(1000)).wait();
  await (await c.transfer(b.address, 123)).wait();
}
main().catch(console.error);
```
```bash
EVT=0x... npx hardhat run scripts/use-event-token.ts --network sepolia
```

---

## 3. ハンズオンB：ブラウザ購読（React + ethers）

`dapp/src/hooks/useEvents.ts`
```ts
import { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';

export function useTransferEvents(addr: string){
  const [logs, setLogs] = useState<any[]>([]);
  const unsub = useRef<() => void>();
  useEffect(()=>{
    if(!(window as any).ethereum || !addr) return;
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const iface = new ethers.Interface([
      'event TransferLogged(address indexed from, address indexed to, uint256 amount)'
    ]);
    const topic0 = iface.getEvent('TransferLogged').topicHash;
    const filter = { address: addr, topics: [topic0] };
    const handler = (log:any)=>{
      const parsed = iface.parseLog({topics: log.topics, data: log.data});
      setLogs(v=>[{ block: log.blockNumber, ...parsed.args }, ...v].slice(0,50));
    };
    (provider as any).on(filter, handler);
    unsub.current = ()=> (provider as any).off(filter, handler);
    return ()=> unsub.current?.();
  },[addr]);
  return logs;
}
```

`dapp/src/App.tsx` に表示を追加：
```tsx
import { useTransferEvents } from './hooks/useEvents';
const EVT = import.meta.env.VITE_EVENT_TOKEN as string;
...
const events = useTransferEvents(EVT);
...
<h3>Recent Transfers</h3>
<ul>
  {events.map((e,i)=> <li key={i}>#{String(e.block)} {String(e.from)} → {String(e.to)} : {String(e.amount)}</li>)}
</ul>
```
`.env` に `VITE_EVENT_TOKEN=0x...` を追加。

---

## 4. ハンズオンC：The Graph（サブグラフ作成）

### 4.1 CLI準備
```bash
npm i -g @graphprotocol/graph-cli
```

### 4.2 ひな形生成（Hosted/Studioどちらでも）
```bash
graph init \
  --from-contract <EVENT_TOKEN_ADDR> \
  --network sepolia \
  subgraph/event-token
cd subgraph/event-token
npm i
```
> 生成内容：`subgraph.yaml`（データソース定義）、`schema.graphql`（GraphQLスキーマ）、`src/mapping.ts`（イベント→エンティティ変換）。

### 4.3 スキーマ編集
`schema.graphql`
```graphql
type Transfer @entity {
  id: ID!
  block: BigInt!
  txHash: Bytes!
  from: Bytes!
  to: Bytes!
  amount: BigInt!
}
```

### 4.4 マッピング実装
`src/mapping.ts`
```ts
import { TransferLogged as Ev } from "../generated/EventToken/EventToken";
import { Transfer } from "../generated/schema";

export function handleTransferLogged(e: Ev): void {
  const id = e.transaction.hash.toHex() + '-' + e.logIndex.toString();
  const t = new Transfer(id);
  t.block = e.block.number;
  t.txHash = e.transaction.hash;
  t.from = e.params.from;
  t.to = e.params.to;
  t.amount = e.params.amount;
  t.save();
}
```

`subgraph.yaml`（該当イベントをマッピング）
```yaml
datasources:
  - kind: ethereum
    name: EventToken
    network: sepolia
    source:
      address: "<EVENT_TOKEN_ADDR>"
      abi: EventToken
      startBlock: <DEPLOY_BLOCK>
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities: [Transfer]
      abis:
        - name: EventToken
          file: ./abis/EventToken.json
      eventHandlers:
        - event: TransferLogged(indexed address,indexed address,uint256)
          handler: handleTransferLogged
      file: ./src/mapping.ts
```

### 4.5 コード生成・ビルド・デプロイ
```bash
graph codegen
graph build
# デプロイはGraph Studio/Hostedの手順に従う（Authトークンが必要）
# 例: graph auth --studio <TOKEN>
#     graph deploy --studio event-token
```

### 4.6 クエリ
Graph Studio（またはローカルGraphノード）で実行：
```graphql
{
  transfers(first: 5, orderBy: block, orderDirection: desc){
    block
    from
    to
    amount
  }
}
```

---

## 5. 運用メモ
- **startBlock** を正確に設定し、不要な全履歴スキャンを避ける。
- 重大アップグレード時は**新サブグラフ**を切る（移行容易に）。
- 大量イベントは**ページング**と**時間窓**でバッチ取得。

---

## 6. トラブルシュート
| 症状 | 原因 | 対策 |
|---|---|---|
| レシートにイベントが出ない | `emit`忘れ、署名不一致 | ABI/シグネチャ確認（型順序/`indexed`） |
| Provider購読が発火しない | フィルタtopic不一致 | `iface.getEvent().topicHash`を再確認 |
| サブグラフbuild失敗 | ABI/スキーマ不整合 | `codegen`→型の再生成 |
| 取得が遅い | startBlockが古すぎる | 部分同期 or 新規サブグラフで範囲限定 |

---

## 7. 提出物
- EventTokenアドレス、`useEvents`でのリアルタイムログのスクリーンショット。
- サブグラフの`graph build`ログとGraphQLクエリ結果。
- `subgraph.yaml`の`startBlock`と`schema.graphql`の最終版。
