# Ethereumカリキュラム補足資料集（Appendix）

## 0. 本リポジトリ内の補足
- Verify（ソース検証）：`docs/appendix/verify.md`
- GitHub Actions / CI：`docs/appendix/ci-github-actions.md`
- The Graph（Subgraph Studio）：`docs/appendix/the-graph.md`
- AA（ERC‑4337 / EIP‑7702）：`docs/appendix/account-abstraction.md`

## A. 推奨学習リソース

### A.1 公式ドキュメント

| 種別 | URL | 内容 |
|------|-----|------|
| Ethereum Developer Portal | https://ethereum.org/en/developers/ | 全体像と入門解説 |
| Ethereum security and scam prevention | https://ethereum.org/security/ | wallet / seed phrase / approval / phishing の安全確認 |
| Ethereum Pectra | https://ethereum.org/roadmap/pectra/ | Pectra 有効化と EIP-7702 / EIP-7691 など |
| Ethereum Fusaka / PeerDAS | https://ethereum.org/roadmap/fusaka/peerdas/ | Fusaka、PeerDAS、blob scaling の現行説明 |
| Ethereum Foundation protocol announcements | https://blog.ethereum.org/category/protocol | mainnet / testnet upgrade announcement |
| Solidity Docs | https://docs.soliditylang.org/ | 言語仕様・リリースノート・security considerations |
| OpenZeppelin Contracts 5.x | https://docs.openzeppelin.com/contracts/5.x | 監査済み release / dev tag / upgradeable 境界 |
| Hardhat 3 Docs | https://hardhat.org/docs/getting-started | 新規プロジェクト向けの現行導線 |
| Hardhat 2 Docs | https://v2.hardhat.org/hardhat-runner/docs/getting-started | 本リポジトリの Hardhat 2.x 互換確認 |
| Foundry | https://www.getfoundry.sh/ | 高速テストツールセット |
| The Graph | https://thegraph.com/docs/en/ | Subgraph / Substreams / Token API と対応チェーン |
| Optimism Docs | https://docs.optimism.io/ | L2アーキテクチャとブリッジ |
| Arbitrum Docs | https://docs.arbitrum.io/ | L2運用ガイド |
| zkSync Era | https://docs.zksync.io/ | ZK Rollup実装とSDK |
| OpenSea Docs | https://docs.opensea.io/ | NFT標準とメタデータガイド |

---

## B. 主要EIP・標準仕様

| EIP | 名称 | 概要 |
|-----|------|------|
| 20 | ERC‑20 Token Standard | Fungibleトークン標準 |
| 165 | Standard Interface Detection | `supportsInterface`判定 |
| 173 | Ownable Standard | 所有権転送仕様 |
| 1967 | Proxy Storage Slots | UUPS/Transparent Proxy用Slot予約 |
| 2612 | Permit for ERC‑20 | 署名承認によるガスレス送金 |
| 2718 | Typed Transaction Envelope | Tx型定義（EIP‑1559含む） |
| 2771 | Meta‑Transactions | Relayer経由トランザクション |
| 2981 | NFT Royalty Standard | 二次流通ロイヤリティ通知 |
| 4337 | Account Abstraction via EntryPoint | コンセンサス変更なしでAAを実現（UserOperation/EntryPoint/Bundler） |
| 4844 | Proto‑Danksharding (Blob) | L2のデータ可用性（DA）コスト改善 |
| 7691 | Blob throughput increase | Pectra で blob の target/max を 3/6 から 6/9 に増やした Core EIP |
| 7702 | EOA delegation | Pectra の account abstraction 系改善。署名・wallet UX・phishing 境界を確認する |
| 7594 | PeerDAS | Fusaka の主要機能。blob data availability を sampling で検証する方向へ進める |
| 7892 | Blob Parameter Only Hardforks | Fusaka 後の blob target/max 調整を BPO fork として扱う |

---

## C. 実務リファレンス

| 項目 | 推奨ツール/標準 | 補足 |
|------|----------------|------|
| 秘密鍵管理 | AWS KMS, GCP KMS, HashiCorp Vault | dev/private keyは避ける |
| CI/CD | GitHub Actions, CircleCI | デプロイ前にLint/Verify |
| セキュリティ監査 | Slither, Foundry fuzz/invariant, Echidna, 専門監査 | 自動検出は補助。threat model と manual review を併用 |
| 分析/監視 | Tenderly, Etherscan API, Dune | Txリプレイ・メトリクス可視化 |
| ステーブルデプロイ | Safe (旧Gnosis Safe) | マルチシグ管理 |

---

## D. よくあるトラブルと対策

| カテゴリ | 症状 | 原因 | 解決策 |
|------------|------|------|---------|
| デプロイ | `nonce too low` | 同アカウントでTx競合 | Hardhatの`nonce`指定 or reset |
| Verify | `Error HH606` | コンパイラ設定不一致 | `solidity.version`と一致させる |
| MetaMask | `invalid chainId` | RPC 設定ミス | 正しい Chain ID を指定（Sepolia=11155111, Optimism=10） |
| IPFS | 画像が表示されない | CID や拡張子誤り | Gateway経由で検証 |
| Event購読 | ログが出ない | トピック不一致 | イベント定義とABI整合性を確認 |
| Subgraph | `index out of range` | startBlock誤設定 | 正確なブロック番号に修正 |

---

## E. 発展学習テーマ

| テーマ | 目的 |
|---------|------|
| zk‑SNARK / zk‑STARK | ZK Rollupの暗号基礎を理解する |
| MEV（Maximal Extractable Value。旧称 Miner Extractable Value） | トランザクション順序操作の影響を学ぶ |
| EigenLayer / Restaking | Ethereumセキュリティ再利用の仕組み |
| Account Abstraction（EIP‑4337） | スマートウォレットによるUX改善 |
| L2間ブリッジ | 複数L2を跨ぐ資産移動設計。公式導線、trust assumption、withdrawal/finality、rescue 手順を確認 |
| Rollup‑as‑a‑Service | 独自L2構築の実務モデル |

---

## F. 推奨学習順（本コース修了後）
1. **Ethereum → zk技術入門**（Zero‑Knowledge基礎）
2. **スマートコントラクト監査実践**（Audit/CTF演習）
3. **DeFiプロトコル設計分析**（AMM/レンディング/ステーキング）
4. **アカウント抽象化実装（EIP‑4337）**
5. **自作サブグラフ・データ分析（Dune + TheGraph）**
6. **L2独自チェーン構築（Optimism OP Stack / Arbitrum Orbit）**

---

## G. 参考書籍・講座

| 分類 | タイトル | 著者/提供元 | 出版年/版 | 対応Day（目安） | 備考 |
|------|----------|-------------|-----------|------------------|------|
| 書籍（英語） | Mastering Ethereum: Building Smart Contracts and DApps | Andreas M. Antonopoulos / Gavin Wood | 1st ed., 2018 | Day01-05, Day12 | 概念は有効だが、ツール/ネットワーク周りは陳腐化しやすい |
| 書籍（日本語） | Solidityプログラミング ―ブロックチェーン・スマートコントラクト開発入門 | Ritesh Modi（著）/ 花村直親ほか（訳） | 2019 | Day04-05 | Solidity入門（周辺ツールは現行手順に読み替える） |
| 書籍（日本語） | Solidity とEthereumによる実践スマートコントラクト開発 ―Truffle Suiteを用いた開発の基礎からデプロイまで | Kevin Solorio / Randall Kanna / David H. Hoover（著） | 2021（邦訳） | Day03-07 | フレームワークがTruffle中心のため、Hardhatに読み替える前提 |
| 書籍（日本語） | スマートコントラクト本格入門 ―FinTechとブロックチェーンが作り出す近未来がわかる | 鳥谷部昭寛 / 加世田敏宏 / 林田駿弥（著） | 2017 | Day01-04 | 全体像・背景理解向け（実装は現在の環境に合わせて補う） |
| 無料講座 | CryptoZombies | https://cryptozombies.io/ | 随時更新 | Day04 | ブラウザ上でゲーム形式学習 |
| 無料講座 | ChainShot / Encode Club | https://www.chainshot.com/ / https://www.encode.club/ | 随時更新 | Day04-07, Day12 | 課題駆動の短期コースが多い |
| 有料講座 | ConsenSys Academy | https://consensys.io/academy | 随時更新 | Day01-14 | コース改定があるため、内容は都度確認 |

---

## H. 補足ツール集

| 用途 | CLI/サービス | 備考 |
|------|--------------|------|
| トランザクション再現 | Tenderly CLI / UI | 実行状況のステップ実行が可能 |
| ガス/Blob手数料確認 | Etherscan Gas Tracker, Blocknative, chain-specific Explorer / status page | Mainnet/L2/Blob の混雑と RPC 差分を時刻つきで確認 |
| 構造図生成 | Mermaid, draw.io | サブグラフやフロー可視化 |
| ドキュメント生成 | TypeDoc, mdBook | Hardhat / Foundry連携可 |
| 教材配布 | GitHub Pages, Notion, Zenn | Markdown変換容易 |

---

## I. まとめ
この補足資料はDay1〜14の学習内容を横断的に補強する。特に、セキュリティ・監査・L2構築・ZK応用を次段階のテーマとして推奨する。
