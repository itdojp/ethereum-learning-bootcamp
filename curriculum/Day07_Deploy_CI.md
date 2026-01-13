# Day7：本番・L2デプロイ／Etherscan検証／手動承認付きCI

[← 目次](./TOC.md) | [前: Day6](./Day06_Local_Testing.md) | [次: Day8](./Day08_L2_Rollups.md)

## 学習目的
- 少額でMainnetまたはL2に安全にデプロイする流れを体得。
- ソース検証（Verify）と成果の可観測性を確保。
- GitHub Actionsに“人間の手動承認”ゲートを設け、誤デプロイを防ぐ。

> まず `curriculum/README.md` の「共通の前提」を確認してから進める。

---

## 0. 前提
- Hardhat構成はDay3までに完了。
- `.env`に鍵とRPCを設定し、**秘密情報はGitにコミットしない**。
- 先に読む付録：[`appendix/verify.md`](../appendix/verify.md) / [`appendix/ci-github-actions.md`](../appendix/ci-github-actions.md)
- 触るファイル（主なもの）：`scripts/deploy-generic.ts` / `.github/workflows/deploy.yml` / `DEPLOYMENTS.md` / `hardhat.config.ts`（任意）
- 今回触らないこと：いきなり多額で本番デプロイ（まずは少額・段階的に進める）
- 最短手順（迷ったらここ）：1章の `deploy-generic.ts` で少額デプロイ → 2章でVerify（任意）→ 4章で手動承認付きCIの要点を確認

`.env.example`
```
SEPOLIA_RPC_URL=
MAINNET_RPC_URL=
OPTIMISM_RPC_URL=
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=
OPTIMISTIC_ETHERSCAN_API_KEY=
```

---

## 1. デプロイスクリプトの汎用化
`scripts/deploy-generic.ts`
```ts
import { ethers, network } from "hardhat";

// デプロイ対象とコンストラクタ引数は環境変数で指定可能
// 例: CONTRACT=MyToken ARGS="100000000000000000000" npx hardhat run ...
async function main(){
  const name = process.env.CONTRACT || "Lock";
  const args = (process.env.ARGS||"").split(" ").filter(Boolean);
  console.log("network:", network.name, "contract:", name, "args:", args);
  const F = await ethers.getContractFactory(name);
  const c = await F.deploy(...(args as any));
  await c.waitForDeployment();
  console.log("deployed:", await c.getAddress());
}

main().catch((e)=>{console.error(e);process.exit(1)});
```

**実行例**（MainnetにLockを小額で）
```bash
npx hardhat run scripts/deploy-generic.ts --network mainnet
```
**実行例**（OptimismにERC20を供給量指定で）
```bash
CONTRACT=MyToken ARGS=1000000000000000000000000 \
  npx hardhat run scripts/deploy-generic.ts --network optimism
```

---

## 2. Verify（ソース検証）
Hardhat Verifyプラグインを導入（Day5参照）。

**コマンド例（Mainnet：Lock）**
```bash
npx hardhat verify --network mainnet <DEPLOYED_ADDR> 3600
```
**コマンド例（Optimism：MyToken）**
```bash
npx hardhat verify --network optimism <DEPLOYED_ADDR> 1000000000000000000000000
```
> L2ごとにAPIキーが異なる。Blockscout系エクスプローラを使うチェーンでは別途設定が必要。つまずいたら [`appendix/verify.md`](../appendix/verify.md) を参照する。

---

## 3. リスクを下げる運用チェックリスト
- [ ] **少額デプロイ**で動作確認後に本量を配布。
- [ ] `onlyOwner`や役割権限（`AccessControl`）を**最小権限**で発行。
- [ ] 緊急停止（`Pausable`）や**引当金上限**などの**セーフティガード**を有効化。
- [ ] **マルチシグ**（Safe等）で管理鍵を保管。単独鍵は避ける。
- [ ] **ソース検証(Verify)** を実施し、アドレス・ABI・TxHashをREADMEに残す。
- [ ] すべての機能に**単体テストとカバレッジ**（Day6）を要求。

---

## 4. GitHub Actions：手動承認付きデプロイ
### 4.1 環境（Environment）で承認者を設定
GitHub > Settings > Environments > `production` を作成し、**Required reviewers** に承認者を登録。Secrets もここに保存。

- `PRODUCTION_MAINNET_RPC_URL`
- `PRODUCTION_OPTIMISM_RPC_URL`
- `PRODUCTION_PRIVATE_KEY`
- `ETHERSCAN_API_KEY`
- `OPTIMISTIC_ETHERSCAN_API_KEY`

### 4.2 ワークフロー（手動トリガ + 承認ゲート）
このリポジトリでは `.github/workflows/deploy.yml` を同梱している。必要に応じて編集する。

`.github/workflows/deploy.yml` を開いて確認する。

ポイント：
- `workflow_dispatch` で `network`/`contract`/`args` を受け取る。
- `environment: production` により、実行前にGitHub上での**人間承認**が必須になる。
- Secrets を `hardhat.config.ts` が参照する環境変数名（`MAINNET_RPC_URL` / `OPTIMISM_RPC_URL` など）に揃えて渡す。

> 承認が出ない／Secretsが読めない等で詰まったら [`appendix/ci-github-actions.md`](../appendix/ci-github-actions.md) を参照する。

---

## 5. デプロイ前後のドキュメント化
[`DEPLOYMENTS.md`](../DEPLOYMENTS.md)（同梱。追記して使う）
```
# Deployments

## 例：2025-11-02 mainnet MyToken v1.0.0
- contract: MyToken
- network: mainnet
- address: 0x....
- txHash: 0x....
- compiler: 0.8.24
- verified: etherscan ✅
- owner: Gnosis Safe(2/3) 0x....
- notes: 初期供給 1,000,000 MTK
```

---

## 6. 本番デプロイ手順（最小）
1. **小額**でL2（例：Optimism）へ先行デプロイ。
2. Etherscan/BlockscoutでVerify。
3. DApp・サブグラフ・モニタを接続して動作確認（Day10以降）。
4. Mainnetに本デプロイ。[`DEPLOYMENTS.md`](../DEPLOYMENTS.md) を更新し、リリースタグを付与する。

---

## 7. つまずきポイント
| 症状 | 原因 | 対処 |
|---|---|---|
| `insufficient funds` | 手数料不足 | 少額ETHを補充。maxFee確認 |
| `nonce too low` | ノンス衝突 | `--network`とアカウントの送信履歴を確認 |
| Verify失敗 | コンパイラ設定不一致/引数違い | `hardhat.config.ts`の設定と引数を合わせる。詰まったら [`appendix/verify.md`](../appendix/verify.md) |
| 承認が出ない | Environment reviewers未設定 | Settings > Environments を再確認。詰まったら [`appendix/ci-github-actions.md`](../appendix/ci-github-actions.md) |

---

## 8. まとめ
- デプロイをスクリプト化し、対象コントラクトと引数を環境変数で切り替えられる形にした。
- Verify と `DEPLOYMENTS.md` により、アドレスと根拠（TxHash/設定）を後から追える状態を作った。
- GitHub Actions に手動承認ゲートを入れ、誤デプロイを防ぐ運用の入口を整えた。

## 9. 提出物
- [ ] デプロイログ一式（ネットワーク、アドレス、TxHash）
- [ ] Etherscan/BlockscoutのVerifyリンク
- [ ] [`DEPLOYMENTS.md`](../DEPLOYMENTS.md) の追記差分
- [ ] GitHub Actions実行ページのスクリーンショット（承認→完了）

## 10. 実行例
- 実行ログ例：[`reports/Day07.md`](../reports/Day07.md)
