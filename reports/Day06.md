# Day06 実行ログ

## 対象
- `contracts/GasBench.sol`：`benchSumMemory/benchSumCalldata` を持つベンチ用コントラクト。
- `test/gasbench.ts`：bench関数をTx実行して `hardhat-gas-reporter` に載せるテスト。
- `curriculum/Day06_Local_Testing.md` は既に bench 方針を説明済み。

## コマンド
```
npx hardhat test
```
> Gas reporter を有効化しているため、テスト完了時に関数単位のgas表が出力される。

## 取得した主な数値（USD列は`gasReporter`デフォルト）
| Contract   | Method           | Gas (avg) |
|------------|------------------|-----------|
| GasBench   | `benchSumMemory` | 123,548   |
| GasBench   | `benchSumCalldata` | 91,860  |
| GasBench   | `emitMany`       | 28,944    |
| GasBench   | `setS`           | 43,582    |
| Hello      | `setMessage`     | 29,395    |

memory vs calldata の差分（123,548 vs 91,860）を gasReporter 上で確認でき、教材で述べている「calldata 優先」の理由を再現できた。

## テスト構成メモ
- テストは `await c.waitForDeployment()`・`await tx.wait()` でTx完了を保証。
- bench関数で `s = r` とストレージ書込みを行い、`pure/view` ではなく Tx として実行。
- `emitMany(n)` の n=5 でイベントガスコストを比較可能。

## 追加検証
- `npm ci` → `npx hardhat test` を CI 相当の流れで実行し、全テスト（GasBench/Hello/MyToken/MyNFT/WalletBox）の合計 9 ケースが成功していることも再確認。

## まとめ
1. bench関数経由で memory / calldata / event cost を数値化できる状態を構築済み。
2. ガスレポートの定量結果を Day06 教材の解説値として引用できる。
3. 今後は `npx hardhat coverage` などを追加すれば網羅率チェックへ拡張可能。
