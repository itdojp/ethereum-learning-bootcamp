# Day07 実行ログ

## 実施内容
1. **汎用デプロイスクリプト** `scripts/deploy-generic.ts` を ethers v6 流儀に合わせて `waitForDeployment()` / `getAddress()` へ更新。
2. **GitHub Actions ワークフロー** `.github/workflows/deploy.yml` を追加。
   - `workflow_dispatch` で allowlist 済み `network` / Solidity identifier / `args_json` を入力。
   - testnet-first とし、本番だけ固定確認文字列と `production-*` Environment の承認を強制。
   - network 別 Environment Secrets の `RPC_URL` / `PRIVATE_KEY` だけを取得。
3. **デプロイ履歴ファイル** [`docs/DEPLOYMENTS.md`](../DEPLOYMENTS.md) を作成し、Day04/05/07 で実行したローカルデプロイの記録を追記。
4. **動作確認**：
   ```bash
   CONTRACT=WalletBox ARGS_JSON='["hello"]' \
     npx hardhat run scripts/deploy-generic.ts --network localhost
   → deployed: 0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1
   ```
   - 生成アドレスを `docs/DEPLOYMENTS.md` に追記。

## 参考
- `.env.example` は Etherscan V2 の単一キー契約を使う。deploy workflow は Verify を実行しないため Explorer key を読み込まない。
- Verify コマンド例（未実行）
  - `npx hardhat verify --network mainnet <ADDR> 3600`
  - `npx hardhat verify --network optimism <ADDR> <args...>`

## まとめ
- 人手承認付きのCI/CD雛形とデプロイ記録ファイルを整備し、Day07 の要件（安全なデプロイ手順、Verifyへの導線、記録）をローカルで再現できる形にした。
- 本番ネットで実行する際は network 別 protected Environment の `RPC_URL` / `PRIVATE_KEY`、固定確認文字列、reviewer approval が必要になる。
