# Part 5：統合（概要と進め方）

[← 目次](./TOC.md) | [前: Day13](./Day13_Gas_Optimization.md) | [次: Day14](./Day14_Integration.md)

このPartは「最後に全部つなぐ」章だ。デプロイ→DApp接続→（任意）Verify/CI/The Graphまで、できるところから通す。

## このPartでできるようになること
- コントラクトをデプロイし、DAppから操作できる。
- 記録（Deployments/Reports）を残し、再現できる形にまとめられる。
- 外部連携（Verify/CI/The Graph）を“必要な分だけ”取り入れられる。

## 最短ルート（迷ったらここだけ）
1) Day14：統合：[`Day14_Integration.md`](./Day14_Integration.md)

## 先に読む付録（任意だが詰まりやすい）
- Verify：[`docs/appendix/verify.md`](../appendix/verify.md)
- GitHub Actions / CI：[`docs/appendix/ci-github-actions.md`](../appendix/ci-github-actions.md)
- The Graph：[`docs/appendix/the-graph.md`](../appendix/the-graph.md)

## チェックリスト（ここまでできれば完走）
- [ ] Day14のチェックリストを “Done” にできる（全部でなくてもよい）
- [ ] `docs/reports/` に実行ログを残せる

## 復習問題（理解チェック）
- Q1. `docs/DEPLOYMENTS.md` に最低限残すべき情報を3つ挙げる。
- Q2. `docs/reports/` に実行ログを残す利点は何か？（1〜2文）
- Q3. Day14で「最小の完走」と言える状態は何か？（任意要素を除いて）

### 解答例（短く）
- A1. 例：network/chainId、コントラクト名とアドレス、デプロイTxHash（加えてsolc/optimizer設定も残すとVerifyで迷いにくい）。
- A2. 後から同じ手順を再現でき、どこで失敗したかの切り分けが容易になる。チーム共有の土台にもなる。
- A3. コントラクトを任意ネットへデプロイし、DAppから接続して最低限の操作（残高表示/送金/イベント購読など）が確認できている状態。

---

[← 目次](./TOC.md)
