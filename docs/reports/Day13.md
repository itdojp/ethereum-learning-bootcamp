# Day13 実行ログ

## 追加コード
- `contracts/GasPack.sol`: slot未最適化(`GasNaive`)と packing済(`GasPacked`)を並記。
- `contracts/GasArgs.sol`: `calldata` vs `memory` のループ比較 + `TooLong` custom error + `sumCalldataTx`/`sumMemoryTx` でTxとして計測。
- `contracts/GasEvent.sol`: topic数の違うイベント `e1`/`e2`。
- テスト: `test/gas-pack.ts`, `test/gas-args.ts`, `test/gas-event.ts`。`console.log` で `gasUsed` を出力し `metrics/gas_day13.md` に転記。

## 測定手順
```bash
npx hardhat test test/gas-pack.ts
npx hardhat test test/gas-args.ts
npx hardhat test test/gas-event.ts
```

## 結果（`metrics/gas_day13.md`）
| Case | gasUsed |
|------|--------:|
| Naive.add | 132,685 |
| Packed.add | 88,601 |
| sumCalldataTx(1k) | 394,150 |
| sumMemoryTx(1k) | 394,150 |
| e1 | 22,842 |
| e2 | 23,700 |

- Packingで `add` ガスが約33%減少。
- `sumCalldataTx` と `sumMemoryTx` はほぼ同コスト（大半が `last` SSTORE）。コメントで `calldata` の理論優位を説明済み（コピーコスト差はデータ検証時に顕在化）。
- イベントは `topics` が1→2本に増えると約 850 gas 増加。

## まとめ
1. Day13 で紹介された最適化題材（packing / calldata / event topics）を実コントラクトとテストで再現し、`metrics/gas_day13.md` に数値を整理。
2. ハードハット標準テストのみでガス差を可視化できるため、以降の最適化検証は `npx hardhat test test/gas-pack.ts` などを追加で実行するだけで良い。
3. カスタムエラー (`TooLong`) や `unchecked` ループなど、教材のベストプラクティスをコードベースに追加済み。
