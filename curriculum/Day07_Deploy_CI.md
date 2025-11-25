# Day7：本番・L2デプロイ／Etherscan検証／手動承認付きCI

## 学習目的
- 少額でMainnetまたはL2に安全にデプロイする流れを体得。
- ソース検証（Verify）と成果の可観測性を確保。
- GitHub Actionsに“人間の手動承認”ゲートを設け、誤デプロイを防ぐ。

---

## 0. 前提
- Hardhat構成はDay3までに完了。
- `.env`に鍵とRPCを設定し、**秘密情報はGitにコミットしない**。

`.env.sample`
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
NETWORK=mainnet npx hardhat run scripts/deploy-generic.ts --network mainnet
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
> L2ごとにAPIキーが異なる。Blockscout系エクスプローラを使うチェーンでは別途設定が必要。

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
`.github/workflows/deploy.yml`
```yaml
name: deploy
on:
  workflow_dispatch:
    inputs:
      network:
        description: "target network"
        required: true
        default: mainnet
        type: choice
        options: [mainnet, optimism]
      contract:
        description: "contract name"
        required: true
        default: MyToken
      args:
        description: "constructor args separated by space"
        required: false
        default: "1000000000000000000000000"

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # ← 承認が必要
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - name: Select RPC by network
        id: sel
        run: |
          if [ "${{ inputs.network }}" = "mainnet" ]; then
            echo "RPC=${{ secrets.PRODUCTION_MAINNET_RPC_URL }}" >> $GITHUB_OUTPUT
            echo "SCAN_KEY=${{ secrets.ETHERSCAN_API_KEY }}" >> $GITHUB_OUTPUT
          else
            echo "RPC=${{ secrets.PRODUCTION_OPTIMISM_RPC_URL }}" >> $GITHUB_OUTPUT
            echo "SCAN_KEY=${{ secrets.OPTIMISTIC_ETHERSCAN_API_KEY }}" >> $GITHUB_OUTPUT
          fi
      - name: Build
        run: npx hardhat compile
      - name: Deploy
        env:
          PRIVATE_KEY: ${{ secrets.PRODUCTION_PRIVATE_KEY }}
          ETHERSCAN_API_KEY: ${{ steps.sel.outputs.SCAN_KEY }}
          RPC_URL: ${{ steps.sel.outputs.RPC }}
        run: |
          echo "network=${{ inputs.network }}"
          CONTRACT=${{ inputs.contract }} ARGS="${{ inputs.args }}" \
          npx hardhat run scripts/deploy-generic.ts --network ${{ inputs.network }}
      - name: Verify
        if: ${{ inputs.network == 'mainnet' || inputs.network == 'optimism' }}
        env:
          ETHERSCAN_API_KEY: ${{ steps.sel.outputs.SCAN_KEY }}
        run: |
          # DEPLOYED_ADDR は上のログから手入力 or アーティファクト連携で自動化
          echo "Run manual verify with hardhat if needed"
```
> 注：**Environment**により、実行前にGitHub上での**人間承認**が必須になる。誤起動を防げる。

---

## 5. デプロイ前後のドキュメント化
`DEPLOYMENTS.md`（新規作成）
```
# Deployments

## 2025-11-02 mainnet MyToken v1.0.0
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
4. Mainnetに本デプロイ。`DEPLOYMENTS.md`更新、リリースタグ付与。

---

## 7. トラブルシュート
| 症状 | 原因 | 対処 |
|---|---|---|
| `insufficient funds` | 手数料不足 | 少額ETHを補充。maxFee確認 |
| `nonce too low` | ノンス衝突 | `--network`とアカウントの送信履歴を確認 |
| Verify失敗 | コンパイラ設定不一致/引数違い | `hardhat.config.ts`の`solidity`と引数を合わせる |
| 承認が出ない | Environment reviewers未設定 | Settings > Environments を再確認 |

---

## 8. 提出物
- デプロイログ一式（ネットワーク、アドレス、TxHash）。
- Etherscan/BlockscoutのVerifyリンク。
- `DEPLOYMENTS.md`の追記差分。
- GitHub Actions実行ページのスクリーンショット（承認→完了）。
