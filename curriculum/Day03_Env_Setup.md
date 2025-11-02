# Day3：開発環境構築（Hardhat / Foundry）とテストネット接続

## 学習目的
- HardhatおよびFoundryを導入し、開発・テスト・デプロイの基礎環境を構築する。
- Sepoliaテストネットに接続し、コントラクトをデプロイして動作を確認する。

---

## 1. 理論解説（教科書）

### 1.1 Hardhatとは
- Ethereumスマートコントラクト開発フレームワーク。
- 主な機能：
  - コントラクトのコンパイル、テスト、デプロイの自動化。
  - ローカルEVMノード（Hardhat Network）内蔵。
  - TypeScript対応で型安全なスクリプトが書ける。

### 1.2 Foundryとは
- Rust製の高速開発環境。
- `forge`：テスト実行、デプロイ、検証。
- `cast`：RPC呼び出しなどCLI操作。
- Hardhatより軽量で、高速テストに強い。

### 1.3 ネットワークの種類
| 種類 | 用途 | 例 |
|------|------|----|
| ローカルネット | 開発・単体テスト | Hardhat Network, Anvil |
| テストネット | 検証・チュートリアル | Sepolia, Holesky |
| メインネット | 本番運用 | Ethereum Mainnet |

### 1.4 RPCプロバイダ
- Ethereumノードとの通信API。
- 代表例：Alchemy、Infura、QuickNode。
- Hardhat設定ファイルで指定して利用。

---

## 2. ハンズオン演習

### 2.1 環境構築
#### (1) Node.jsと依存パッケージ
```bash
sudo apt update && sudo apt install -y nodejs npm git
npm install -g npm@latest
```

#### (2) Hardhatプロジェクト作成
```bash
mkdir eth-bootcamp && cd eth-bootcamp
npm init -y
npm install --save-dev hardhat
npx hardhat
```
プロンプトで「Create a TypeScript project」を選択。

#### (3) 推奨プラグインの追加
```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox dotenv
```

#### (4) .envファイルを準備
```bash
cat > .env.sample <<'ENV'
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>
PRIVATE_KEY=0x<YOUR_PRIVATE_KEY>
ETHERSCAN_API_KEY=<YOUR_KEY>
ENV
```
コピーして設定：
```bash
cp .env.sample .env && nano .env
```

---

### 2.2 Hardhat設定
`hardhat.config.ts` を編集：
```ts
import * as dotenv from 'dotenv';
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
export default config;
```

---

### 2.3 サンプルコントラクトのデプロイ
`contracts/Lock.sol`（初期テンプレート）を使用。

#### (1) デプロイスクリプト作成
```bash
cat > scripts/deploy.ts <<'TS'
import { ethers } from "hardhat";

async function main() {
  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(3600); // 1時間ロック
  await lock.deployed();
  console.log("Lock deployed to:", lock.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
TS
```

#### (2) デプロイ実行
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```
出力例：
```
Lock deployed to: 0xF1234...7890
```

---

### 2.4 Etherscanで検証
1. [Sepolia Etherscan](https://sepolia.etherscan.io/) にアクセス。
2. 上記のアドレスを検索し、デプロイTxの確認。
3. `Contract`タブでソースコードVerifyを実施（後日自動化）。

---

### 2.5 Foundryを併用する場合
#### (1) Foundry導入
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge init foundry-demo
cd foundry-demo
```

#### (2) テスト実行
```bash
forge test -vvvv
```

#### (3) RPC呼び出し例
```bash
cast block-number --rpc-url $SEPOLIA_RPC_URL
```

---

## 3. トラブルシューティング
| 症状 | 対応 |
|------|------|
| Error: invalid private key | `.env`内の0xを付け忘れまたは誤記。 |
| ECONNREFUSED / 403 | RPCキーの有効性を確認。 |
| デプロイTxが失敗 | Gas不足またはネットワーク遅延。`
| gasPrice` を手動指定して再送信。 |

---

## 4. レポート提出内容
- Hardhatプロジェクト構成のスクリーンショット。
- デプロイ時のログとコントラクトアドレス。
- `cast block-number` の出力。
- `.env` 設定（APIキーなどは伏せる）。

---

## 5. 発展課題
- Hardhat Networkでローカルテストを行い、`console.log()`でイベント内容を確認。
- Foundryで`forge create`を使ってデプロイを自動化する。

