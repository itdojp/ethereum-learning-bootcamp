# Day3：開発環境構築（Hardhat / Foundry）とテストネット接続

[← 目次](./TOC.md) | [前: Day2](./Day02_Transaction_Gas.md) | [次: Day4](./Day04_Solidity_Basics.md)

## 学習目的
- HardhatおよびFoundryを導入し、開発・テスト・デプロイを実行できる最小環境を用意できるようになる。
- Sepoliaテストネットに接続し、コントラクトをデプロイして動作を確認できるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提（動作確認済みバージョン含む）」を確認してから進める。

---

## 0. 前提
- 推奨：Node.js 20（LTS）
- テストネットへデプロイする場合は、学習用の鍵を用意し、少額のテストETHを入れておく
  - メイン資産の鍵は使わない（流出時の被害が大きい）
- 先に読む付録：[`docs/appendix/verify.md`](../appendix/verify.md)（テストネットへ出す/検証する場合）
- 触るファイル（主なもの）：`.env` / `hardhat.config.ts` / `scripts/deploy-token.ts`（例）
- 今回触らないこと：いきなりMainnetへデプロイ（Day7で“安全な流れ”として扱う）
- 最短手順（迷ったらここ）：2.0 の手順で `npm ci` → `npm test`。`.env` は deploy / verify を行うときだけ作成する。

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

### 2.0 本リポジトリで進める場合（推奨）
このリポジトリには Hardhat プロジェクト（コントラクト・スクリプト・テスト）が同梱されている。ゼロから作る場合は 2.1 以降へ進む。

#### 2.0.1 ローカルだけ先に確認する場合

1) 依存を入れる（リポジトリルート）：
```bash
npm ci
```

2) テストを実行する（ローカルで一通り動くことを確認）：
```bash
npm test
```
期待される出力（最小例）：
```text
16 passing
```
> 数字は追加テストで増減する。最後に `passing` が出ていればよい。
>
> `npm test` はローカルの Hardhat Network を使うため、この段階では `.env` や外部 RPC、秘密鍵は不要。

#### 2.0.2 Sepolia / Optimism へ deploy・verify する場合

1) `.env` を作る：
```bash
cp .env.example .env
```
`.env` は「外部ネットワークへ接続する操作」に応じて必要な値だけ埋める。

- `SEPOLIA_RPC_URL` / `PRIVATE_KEY`: Sepolia deploy
- `ETHERSCAN_API_KEY`: Sepolia verify
- `OPTIMISM_RPC_URL` / `PRIVATE_KEY`: Optimism deploy
- `OPTIMISTIC_ETHERSCAN_API_KEY`: Optimism verify

2) Sepolia にデプロイする（例：MyToken）：
```bash
npx hardhat run scripts/deploy-token.ts --network sepolia
```
期待される出力（最小例）：
```text
MTK: 0x...
```

> Verifyで詰まったら [`docs/appendix/verify.md`](../appendix/verify.md) の「最短成功ルート」→「失敗時の切り分けルート」→「よくあるエラー表」を参照する。

### 2.1 環境構築（参考：ゼロから作る場合）
この節は「本リポジトリを使わず、ゼロから Hardhat プロジェクトを作る」場合の参考だ。迷ったら 2.0 を優先する。

> 注意：以降の章は **本リポジトリの構成（`package.json` / lockfile で依存固定）** を前提にしている。2.1 の手順で作った別プロジェクトに、教材のコードをそのまま混ぜないこと（依存差分で再現性が落ちやすい）。教材を進める場合は、本リポジトリに戻って 2.0 の `npm ci` を実行する。

#### 2.1.0 この節のゴール（成功判定）
- `node -v` が v20 系になっている
- `npx hardhat` で TypeScript プロジェクトを作成できる
- ローカル `npm test` を外部 RPC / 秘密鍵なしで実行できる
- テストネットへ出す場合に `.env` を作成し、必要な値を設定できる

#### 2.1.1 よくある失敗（最短の切り分け）
- `node -v` が古い：`apt` で入る Node が古い場合がある。`nvm` を使う（手順はこの節の A）。
- `nvm` を入れたのに `nvm` が使えない：いったんシェルを再起動する（または `NVM_DIR` を export して `nvm.sh` を読む）。
- `.env` を設定したのにネットワーク接続で落ちる：`SEPOLIA_RPC_URL` が空、または `PRIVATE_KEY` が空でないかを確認する（鍵はコミットしない）。

#### (1) Node.jsと依存パッケージ
> 推奨：**Node.js 20（LTS）**。Ubuntu の `apt` で入る Node が古い場合があるため、初心者は `nvm` を使うと躓きにくい。

**A. nvm（推奨）**
```bash
sudo apt update && sudo apt install -y git curl ca-certificates
# 注意：curl | bash の実行前に、公式スクリプト（install.sh）の内容を確認する
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
# タグは upstream README / release に合わせて更新する

# 以降はシェルを再起動するか、次を実行
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
command -v nvm && nvm --version

nvm install 20
nvm use 20
node -v
npm -v
```

**B. apt（手早いが、Nodeが古い場合あり）**
```bash
sudo apt update && sudo apt install -y nodejs npm git
node -v
npm -v
```

#### (2) Hardhatプロジェクト作成
```bash
mkdir eth-bootcamp && cd eth-bootcamp
npm init -y
npm install --save-dev hardhat@2.22.1
npx hardhat
```
プロンプトで「Create a TypeScript project」を選択。

#### (3) 推奨プラグインの追加
```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox@6.1.0 dotenv@16.4.5
```

#### (4) .envファイルを準備（deploy / verify を行う場合）
```bash
cat > .env.example <<'ENV'
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
ENV
```
コピーして設定：
```bash
cp .env.example .env && nano .env
```
> ローカル `npm test` だけなら、この手順は不要。
> `YOUR_...` は自分の値に置換する。APIキーや秘密鍵はコミットしない。

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

> メモ：このテキストの TypeScript サンプルコードは **ethers v6** を前提とする。古い記事などにある `ethers.utils.parseEther` や `contract.deployed()` という表記は、v6 では `ethers.parseEther` や `waitForDeployment()` に対応する。

---

### 2.3 サンプルコントラクトのデプロイ
`contracts/Lock.sol`（初期テンプレート）を使用。
> 注：本リポジトリには `Lock.sol` は同梱していない（Hardhatを新規作成した場合のテンプレート例）。

#### (1) デプロイスクリプト作成
```bash
cat > scripts/deploy.ts <<'TS'
import { ethers } from "hardhat";

async function main() {
  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(3600); // 1時間ロック
  await lock.waitForDeployment();
  console.log("Lock deployed to:", await lock.getAddress());
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
```text
Lock deployed to: 0xF1234...7890
```

---

### 2.4 Etherscanで検証
1. [Sepolia Etherscan](https://sepolia.etherscan.io/) にアクセス。
2. 上記のアドレスを検索し、デプロイTxの確認。
3. `Contract`タブでソースコードVerifyを実施（後日自動化）。
> Hardhat Verify を使う場合は [`docs/appendix/verify.md`](../appendix/verify.md) を参照する。

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

## 3. つまずきポイント

| 症状 | 対応 |
|------|------|
| Error: invalid private key | `.env`内の0xを付け忘れまたは誤記。 |
| ECONNREFUSED / 403 | RPCキーの有効性を確認。 |
| デプロイTxが失敗 | 手数料不足またはネットワーク遅延。EIP‑1559（`maxFeePerGas`/`maxPriorityFeePerGas`）の自動推定が外れる場合があるので、時間をおいて再送信。 |

---

## 4. 発展課題
- Hardhat Networkでローカルテストを行い、`console.log()`でイベント内容を確認。
- Foundryで`forge create`を使ってデプロイを自動化する。

---

## 5. まとめ
- ルートで `npm ci` し、外部 RPC や秘密鍵なしで `npm test` を実行できる状態を確認した。
- deploy / verify を行う場合にだけ `.env` を作成し、必要な値を設定する運用を押さえた。
- `--network sepolia` でデプロイできることを確認し、任意で Foundry / cast にも触れた。

### 理解チェック（3問）
- Q1. `.env` には何を入れるか？それをGitにコミットしない理由は何か？
- Q2. `--network sepolia` を付けると、何が切り替わるか？
- Q3. デプロイTxが失敗するとき、最初に確認するべきことを3つ挙げる。

### 解答例（短く）
- A1. RPCエンドポイントや秘密鍵など（例：`SEPOLIA_RPC_URL`, `PRIVATE_KEY`）。漏れると資産/権限を奪われ得るため、Gitに残さない。
- A2. Hardhatのネットワーク設定（RPC、chainId、送信アカウントなど）が切り替わり、Txの送信先チェーンが変わる。
- A3. 例：RPCが有効か、秘密鍵の形式（`0x` など）が正しいか、送信元アカウントに手数料分の残高があるか。

### 確認コマンド（最小）
```bash
npm test

# 任意（テストネットにデプロイする場合：要 .env の SEPOLIA_RPC_URL / PRIVATE_KEY）
npx hardhat run scripts/deploy-token.ts --network sepolia
```

## 6. 提出物
- [ ] Hardhatプロジェクト構成のスクリーンショット
- [ ] デプロイ時のログとコントラクトアドレス
- [ ] `cast block-number` の出力
- [ ] `.env` 設定（APIキーなどは伏せる）

## 7. 実行例
- 実行ログ例：[`docs/reports/Day03.md`](../reports/Day03.md)
