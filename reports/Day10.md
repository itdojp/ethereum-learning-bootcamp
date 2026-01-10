# Day10 実行ログ（2026-01 更新）

## 実行（localhost）
1) Hardhat node を起動  
2) `EventToken` をデプロイ  
3) `mint`→`transfer` を実行して `TransferLogged` を発火  

```bash
npx hardhat node
```

別ターミナルで：
```bash
npx hardhat run scripts/deploy-event-token.ts --network localhost
EVT=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
  npx hardhat run scripts/use-event-token.ts --network localhost
```

### 結果（抜粋）
- `EventToken: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- `transfer complete { to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' }`

## DApp（ブラウザ確認が必要）
- `dapp/.env.local` に `VITE_EVENT_TOKEN=0x9fE...` を設定すると、`Recent TransferLogged events` の表示が有効になる。
- ただし `dapp/` は injected provider（MetaMask等）前提のため、この環境ではUI表示まで未確認。

## The Graph（未実施）
- 生成物は同梱しない運用。`subgraph/README.md` と `appendix/the-graph.md` を参照。
