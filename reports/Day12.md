# Day12 実行ログ

## 実装
- 脆弱/安全コントラクト：`contracts/VulnBank.sol`, `SafeBank.sol`, `Attacker.sol` を追加。VulnBankはCEI違反（`bal`更新が送金後）で再入攻撃可能、SafeBankは `ReentrancyGuard` + CEI 順守。
- 権限管理例：`contracts/AdminBox.sol`（Ownable + Pausable）。
- テスト：`test/reentrancy.ts` を実装し、VulnBankが攻撃で枯渇する一方、SafeBankは攻撃Txがrevertすることを確認。

## コマンド
```
# 依存を復元（OZ v5）
npm ci

# 再入テストのみ
npx hardhat test test/reentrancy.ts
# 全体テスト
npx hardhat test
```
結果：全11ケース成功（MyToken, EventToken, GasBench, Hello, FixedPriceMarket, MyNFT, Reentrancy x2, WalletBox）。

## 観測
- `VulnBank` へ10 ETH預けた状態で `Attacker.attack()` を実行すると、`bal[msg.sender]` が未更新の間に再入され、残高が9 ETH未満まで減少。
- `SafeBank` は `nonReentrant` + 先に残高更新を行うため、攻撃Txは revert し drain 不発。
- `AdminBox`（Ownable+Pausable）は Day04/Day11 のサンプルに適用できる汎用テンプレートとして用意。

## 静的解析/ファジング
- Slither / Echidna は外部ツール導入と追加設定が必要なため実行していません。手順メモ：
  - `pipx install slither-analyzer`
  - `slither . --filter-paths node_modules`
  - Foundry/Echidna invariantsを追加する場合は `forge init` で別ディレクトリを生成して `invariant_*.t.sol` を作成。

## まとめ
1. Day12 で扱う再入/権限対策をコードベースに具体化し、攻撃成功/失敗を自動テストで確認できる状態にした。
2. `AdminBox` などのアクセスポリシー雛形を追加したことで、教材の他コントラクトにも Pausable/Ownable を適用しやすくなった。
3. 静的解析・ファジングは環境準備後にすぐ再現できるようコマンドと推奨設定をメモに残した。
