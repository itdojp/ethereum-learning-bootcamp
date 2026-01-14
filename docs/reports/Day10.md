# Day10 実行ログ（2026-01 更新）

## 実行（localhost）
1) Hardhat node を起動  
2) `EventToken` をデプロイ  
3) `mint`→`transfer` を実行して `TransferLogged` を発火  

```bash
./node_modules/.bin/hardhat node
```

別ターミナルで：
```bash
npx hardhat run scripts/deploy-event-token.ts --network localhost
# → EventToken: <EVT>

EVT=<EVT> npx hardhat run scripts/use-event-token.ts --network localhost
```

### 結果（抜粋）
- `EventToken: 0x5FbDB2315678afecb367f032d93F642f64180aa3`
- `transfer complete { to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' }`

## DApp（ブラウザ確認が必要）
- `dapp/.env.local` に `VITE_EVENT_TOKEN=<EVT>` を設定すると、`Recent TransferLogged events` の表示が有効になる。
- ただし `dapp/` は injected provider（MetaMask等）前提のため、この環境ではUI表示まで未確認。

## The Graph（未実施）
- 生成物は同梱しない運用。`docs/subgraph/README.md` と `docs/appendix/the-graph.md` を参照。
