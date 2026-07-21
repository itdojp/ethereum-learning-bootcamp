# Day3：開発環境構築（Hardhat / Foundry）とテストネット接続

[← 目次](./TOC.md) | [前: Day2](./Day02_Transaction_Gas.md) | [次: Day4](./Day04_Solidity_Basics.md)

## 学習目的
- HardhatおよびFoundryを導入し、開発・テスト・デプロイを実行できる最小環境を用意できるようになる。
- Sepoliaテストネットに接続し、コントラクトをデプロイして動作を確認できるようになる。

> まず [`docs/curriculum/index.md`](./index.md) の「共通の前提（動作確認済みバージョン含む）」を確認してから進める。

---

## 0. 現行ツールチェーン確認ゲート

確認日: **2026-07-22（Asia/Tokyo）**。この章は学習再現性を優先しているため、次の境界を明示する。

- 本リポジトリで進める場合は `npm run install:reviewed` によるlockfile再現を優先し、Hardhat 3.11.0 / Node.js 22.12.0以上 / Solidity 0.8.24の組み合わせで確認する。
- Hardhat 3のESM、declarative config、明示的network connectionを前提にする。Hardhat 2の記事にあるglobal `ethers` importやplugin side-effect importを混在させない。
- plugin、ethers、Mocha、TypeScriptは `package.json` とlockfileのexact versionを正本にする。更新時は `npm run check:all` で互換性とauditを再確認する。
- Foundry は `foundryup` で安定版を導入できるが、インストールスクリプトや binary attestation、nightly / specific version の扱いは公式ドキュメントで確認する。
- Sepolia、Holesky、Hoodi などの testnet、faucet、Explorer、RPC URL、Verify API は変更され得る。デプロイ前に公式情報と chainId を確認し、Mainnet や実資産の鍵は使わない。

---

## 1. 前提
- 必須：Node.js 22.12.0以上
- テストネットへデプロイする場合は、学習用の鍵を用意し、少額のテスト ETH を入れておく
  - メイン資産の鍵は使わない（流出時の被害が大きい）
- 先に読む付録：[`docs/appendix/verify.md`](../appendix/verify.md)（テストネットへ出す/検証する場合）
- 触るファイル（主なもの）：`.env` / `hardhat.config.ts` / `scripts/deploy-token.ts`（例）
- 今回触らないこと：いきなりMainnetへデプロイ（Day7で“安全な流れ”として扱う）
- 最短手順（迷ったらここ）：3.0 の手順で `npm run install:reviewed` → `npm test`。`.env` は deploy / verify を行うときだけ作成する。

---

## 2. 理論解説（教科書）

### 2.1 Hardhatとは
- Ethereumスマートコントラクト開発フレームワーク。
- 主な機能：
  - コントラクトのコンパイル、テスト、デプロイの自動化。
  - ローカル EVM ノード（Hardhat Network）内蔵。
  - TypeScript対応で型安全なスクリプトが書ける。

### 2.2 Foundryとは
- Rust製の高速開発環境。
- `forge`：テスト実行、デプロイ、検証。
- `cast`：RPC 呼び出しなど CLI 操作。
- Hardhat より軽量で、高速テストに強い。

### 2.3 ネットワークの種類

| 種類 | 用途 | 例 |
|------|------|----|
| ローカルネット | 開発・単体テスト | Hardhat Network, Anvil |
| テストネット | 検証・チュートリアル | Sepolia, Holesky |
| メインネット | 本番運用 | Ethereum Mainnet |

### 2.4 RPCプロバイダ
- Ethereumノードとの通信API。
- 代表例：Alchemy、Infura、QuickNode。
- Hardhat 設定ファイルで指定して利用。

---

## 3. ハンズオン演習

### 3.0 本リポジトリで進める場合（推奨）
このリポジトリには Hardhat プロジェクト（コントラクト・スクリプト・テスト）が同梱されている。ゼロから作る場合は 3.1 以降へ進む。

#### 3.0.1 ローカルだけ先に確認する場合

1) 依存を入れる（リポジトリルート）：
```bash
npm run install:reviewed
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

#### 3.0.2 テストネットへdeploy、または外部networkをread / Verifyする場合

1) `.env` を作る：
```bash
cp .env.example .env
```
`.env` は「外部ネットワークへ接続する操作」に応じて必要な値だけ埋める。

- `SEPOLIA_RPC_URL` / `PRIVATE_KEY`: Sepolia deploy
- `OPTIMISM_SEPOLIA_RPC_URL` / `PRIVATE_KEY`: OP Sepolia deploy
- `MAINNET_RPC_URL`: Mainnet read / Verify（deploy signerは設定しない）
- `OPTIMISM_RPC_URL`: Optimism read / Verify（deploy signerは設定しない）
- `ETHERSCAN_API_KEY`: Etherscan V2 による Sepolia / OP Sepolia / Mainnet / Optimism verify

このリポジトリでは`PRIVATE_KEY`をSepolia / OP Sepoliaの学習用deployにだけ使用する。Mainnet / Optimismは`hardhat.config.ts`で`accounts: []`に固定し、本番用private keyを読み込まない。

2) Sepolia にデプロイする（例：MyToken）：
```bash
npx hardhat run scripts/deploy-token.ts --network sepolia
```
期待される出力（最小例）：
```text
MTK: 0x...
```

> Verifyで詰まったら [`docs/appendix/verify.md`](../appendix/verify.md) の「最短成功ルート」→「失敗時の切り分けルート」→「よくあるエラー表」を参照する。

### 3.1 環境構築（参考：ゼロから作る場合）
この節は「本リポジトリを使わず、ゼロから Hardhat プロジェクトを作る」場合の参考だ。迷ったら 3.0 を優先する。

> 注意：以降の章は **本リポジトリの構成（`package.json` / lockfile で依存固定）** を前提にしている。3.1 の手順で作った別プロジェクトに、教材のコードをそのまま混ぜないこと（依存差分で再現性が落ちやすい）。教材を進める場合は、本リポジトリに戻って 3.0 の `npm run install:reviewed` を実行する。

#### 3.1.0 この節のゴール（成功判定）
- `node -v` がv22.12.0以上になっている
- `npx hardhat` で TypeScript プロジェクトを作成できる
- ローカル `npm test` を外部 RPC / 秘密鍵なしで実行できる
- テストネットへ出す場合に `.env` を作成し、必要な値を設定できる

#### 3.1.1 よくある失敗（最短の切り分け）
- `node -v` が古い：`apt` で入る Node が古い場合がある。`nvm` を使う（手順はこの節の A）。
- `nvm` を入れたのに `nvm` が使えない：いったんシェルを再起動する（または `NVM_DIR` を export して `nvm.sh` を読む）。
- `.env` を設定したのにネットワーク接続で落ちる：`SEPOLIA_RPC_URL` が空、または `PRIVATE_KEY` が空でないかを確認する（鍵はコミットしない）。

#### (1) Node.jsと依存パッケージ
> 必須：**Node.js 22.12.0以上**。Ubuntuの `apt` で入るNodeが古い場合があるため、初心者は `nvm` を使うと躓きにくい。

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

nvm install 22
nvm use 22
node -v
npm -v
```

**B. apt（手早いが、Nodeが古い場合あり）**
```bash
sudo apt update && sudo apt install -y nodejs npm git
node -v
npm -v
```

#### (2) Hardhat プロジェクト作成
```bash
mkdir eth-bootcamp && cd eth-bootcamp
npm init -y
npm pkg set type=module
npm install --save-dev --save-exact hardhat@3.11.0
npx hardhat --init
```
プロンプトでMocha + ethersのTypeScript projectを選択する。表示されるテンプレートや質問はHardhatのversionで変わるため、`npx hardhat --version` を記録する。本教材を再現する場合は新規生成せず、このrepositoryのlockfileを使用する。

#### (3) 推奨プラグインの追加
```bash
npm install --save-dev --save-exact \
  @nomicfoundation/hardhat-ethers@4.0.15 \
  @nomicfoundation/hardhat-ethers-chai-matchers@3.0.11 \
  @nomicfoundation/hardhat-mocha@3.0.21 \
  @nomicfoundation/hardhat-verify@3.0.21 \
  ethers@6.17.0 chai@6.2.2 mocha@11.7.6
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
> `YOUR_...` は自分の値に置換する。API キーや秘密鍵はコミットしない。

---

### 3.2 Hardhat 設定
`hardhat.config.ts` を編集：
```ts
import 'dotenv/config';
import hardhatEthers from '@nomicfoundation/hardhat-ethers';
import hardhatEthersChaiMatchers from '@nomicfoundation/hardhat-ethers-chai-matchers';
import hardhatMocha from '@nomicfoundation/hardhat-mocha';
import hardhatVerify from '@nomicfoundation/hardhat-verify';
import { configVariable, defineConfig } from 'hardhat/config';

export default defineConfig({
  plugins: [hardhatEthers, hardhatEthersChaiMatchers, hardhatMocha, hardhatVerify],
  solidity: { version: '0.8.24' },
  networks: {
    sepolia: {
      type: 'http',
      chainType: 'l1',
      chainId: 11155111,
      url: configVariable('SEPOLIA_RPC_URL'),
      accounts: [configVariable('PRIVATE_KEY')]
    }
  },
  verify: { etherscan: { apiKey: configVariable('ETHERSCAN_API_KEY') } }
});
```

> メモ：このテキストの TypeScript サンプルコードは **ethers v6** を前提とする。古い記事などにある `ethers.utils.parseEther` や `contract.deployed()` という表記は、v6 では `ethers.parseEther` や `waitForDeployment()` に対応する。

---

### 3.3 サンプルコントラクトのデプロイ
`contracts/Lock.sol`（初期テンプレート）を使用。
> 注：本リポジトリには `Lock.sol` は同梱していない（Hardhatを新規作成した場合のテンプレート例）。

#### (1) デプロイスクリプト作成
```bash
cat > scripts/deploy.ts <<'TS'
import { network } from "hardhat";

const { ethers } = await network.create();

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

### 3.4 Etherscanで検証
1. [Sepolia Etherscan](https://sepolia.etherscan.io/) にアクセス。
2. 上記のアドレスを検索し、デプロイTxの確認。
3. `Contract`タブでソースコードVerifyを実施（後日自動化）。
> Hardhat Verify を使う場合は [`docs/appendix/verify.md`](../appendix/verify.md) を参照する。

---

### 3.5 Foundryを併用する場合
#### (1) Foundry導入
```bash
# 実行前に公式ドキュメントとインストールスクリプトを確認する
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge init foundry-demo
cd foundry-demo
```

#### (2) テスト実行
```bash
forge test -vvvv
```

#### (3) RPC 呼び出し例
```bash
cast block-number --rpc-url $SEPOLIA_RPC_URL
```

---

## 4. つまずきポイント

| 症状 | 対応 |
|------|------|
| Error: invalid private key | `.env`内の0xを付け忘れまたは誤記。 |
| ECONNREFUSED / 403 | RPCキー、無料枠、rate limit、対象チェーンの有効性を公式画面で確認。 |
| デプロイTxが失敗 | 手数料不足またはネットワーク遅延。EIP‑1559（`maxFeePerGas`/`maxPriorityFeePerGas`）の自動推定が外れる場合があるので、時間をおいて再送信。 |

---

## 5. 発展課題
- Hardhat Networkでローカルテストを行い、`console.log()`でイベント内容を確認。
- Foundryで`forge create`を使ってデプロイを自動化する。

---

## 6. まとめ
- ルートで `npm run install:reviewed` を実行し、外部 RPC や秘密鍵なしで `npm test` を実行できる状態を確認した。
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

## 7. 提出物
- [ ] Hardhat プロジェクト構成のスクリーンショット
- [ ] デプロイ時のログとコントラクトアドレス
- [ ] `cast block-number` の出力
- [ ] `.env` 設定（API キーなどは伏せる）

## 8. 実行例
- 実行ログ例：[`docs/reports/Day03.md`](../reports/Day03.md)
