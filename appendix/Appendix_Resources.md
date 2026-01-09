# Ethereumカリキュラム補足資料集（Appendix）

## A. 推奨学習リソース

### A.1 公式ドキュメント
| 種別 | URL | 内容 |
|------|-----|------|
| Ethereum Developer Portal | https://ethereum.org/en/developers/ | 全体像と入門解説 |
| Solidity Docs | https://docs.soliditylang.org/ | 言語仕様・リリースノート |
| OpenZeppelin Contracts | https://docs.openzeppelin.com/contracts/ | セキュリティ対応済み実装集 |
| Hardhat | https://hardhat.org/ | 開発環境設定とプラグインAPI |
| Foundry | https://book.getfoundry.sh/ | 高速テストツールセット |
| The Graph | https://thegraph.com/docs/en/ | イベントインデックスとGraphQLクエリ |
| Optimism Docs | https://community.optimism.io/docs/ | L2アーキテクチャとブリッジ |
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
| 7691 | Blob throughput increase | blob の target/max を 3/6 → 6/9 に増やす（Pectra） |
| 7702 | EOA delegation | EOAが delegation indicator を持ち、実行時に別コードへ委譲し得る |

---

## C. 実務リファレンス
| 項目 | 推奨ツール/標準 | 補足 |
|------|----------------|------|
| 秘密鍵管理 | AWS KMS, GCP KMS, HashiCorp Vault | dev/private keyは避ける |
| CI/CD | GitHub Actions, CircleCI | デプロイ前にLint/Verify |
| セキュリティ監査 | Slither, Mythril, Echidna | 自動検出＋専門監査併用 |
| 分析/監視 | Tenderly, Etherscan API, Dune | Txリプレイ・メトリクス可視化 |
| ステーブルデプロイ | Safe (旧Gnosis Safe) | マルチシグ管理 |

---

## D. よくあるトラブルと対策
| カテゴリ | 症状 | 原因 | 解決策 |
|------------|------|------|---------|
| デプロイ | `nonce too low` | 同アカウントでTx競合 | Hardhatの`nonce`指定 or reset |
| Verify | `Error HH606` | コンパイラ設定不一致 | `solidity.version`と一致させる |
| MetaMask | `invalid chainId` | RPC設定ミス | 正しいChain IDを指定（Sepolia=11155111, Optimism=10） |
| IPFS | 画像が表示されない | CIDや拡張子誤り | Gateway経由で検証 |
| Event購読 | ログが出ない | トピック不一致 | イベント定義とABI整合性を確認 |
| Subgraph | `index out of range` | startBlock誤設定 | 正確なブロック番号に修正 |

---

## E. 発展学習テーマ
| テーマ | 目的 |
|---------|------|
| zk‑SNARK / zk‑STARK | ZK Rollupの暗号基礎を理解する |
| MEV（Miner Extractable Value） | トランザクション順序操作の影響を学ぶ |
| EigenLayer / Restaking | Ethereumセキュリティ再利用の仕組み |
| Account Abstraction（EIP‑4337） | スマートウォレットによるUX改善 |
| L2間ブリッジ | 複数L2を跨ぐ資産移動設計 |
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
| 分類 | タイトル / 提供元 | 備考 |
|------|----------------|------|
| 書籍 | 『Mastering Ethereum』（Andreas Antonopoulos） | Ethereum基礎〜応用解説書の定番 |
| 書籍 | 『Solidityプログラミング』（O'Reilly Japan） | 実装中心。初級者向け |
| 書籍 | 『DeFiとスマートコントラクトのしくみ』（技術評論社） | 金融応用視点 |
| 無料講座 | CryptoZombies | ブラウザ上でゲーム形式学習 |
| 無料講座 | ChainShot / Encode Club | 短期ブートキャンプ形式 |
| 有料講座 | ConsenSys Academy | 開発者公式認定コース |

---

## H. 補足ツール集
| 用途 | CLI/サービス | 備考 |
|------|--------------|------|
| トランザクション再現 | Tenderly CLI / UI | 実行状況のステップ実行が可能 |
| ガス推定 | ethgasstation.info, Blocknative | Mainnet動向監視 |
| 構造図生成 | Mermaid, draw.io | サブグラフやフロー可視化 |
| ドキュメント生成 | TypeDoc, mdBook | Hardhat / Foundry連携可 |
| 教材配布 | GitHub Pages, Notion, Zenn | Markdown変換容易 |

---

## I. まとめ
この補足資料はDay1〜14の学習内容を横断的に補強する。特に、セキュリティ・監査・L2構築・ZK応用を次段階のテーマとして推奨する。
