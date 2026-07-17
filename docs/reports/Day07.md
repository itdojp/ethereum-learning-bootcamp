# Day07 実行ログ

## 実施内容
1. **汎用デプロイスクリプト** `scripts/deploy-generic.ts` を ethers v6 流儀に合わせて `waitForDeployment()` / `getAddress()` へ更新。
2. **GitHub Actions ワークフロー** `.github/workflows/deploy.yml` を追加。
   - `workflow_dispatch` で allowlist 済み `network` / Solidity identifier / `args_json` を入力。
   - `sepolia` / `optimismSepolia` だけを allowlist とし、本番 network を入力から除外する。production secret と signer も持たない。
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
- testnet 専用の CI/CD 雛形とデプロイ記録ファイルを整備し、Day07 の要件（安全なデプロイ手順、Verify への導線、記録）をローカルで再現できる形にした。
- 単独運用では自己承認や AI レビューを独立統制とみなさず、GitHub Actions と repository signer を testnet 専用に制限する。本番 deploy は外部署名境界を持つ別 runbook なしでは実行しない。
