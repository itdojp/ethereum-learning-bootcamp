# Day06 実行ログ（2026-07-22更新）

## 対象
- `contracts/GasBench.sol`：`benchSumMemory` / `benchSumCalldata` を持つベンチ用コントラクト。
- `test/gasbench.ts`：bench関数をTx実行してHardhat 3組み込みgas statisticsに載せるテスト。
- [`docs/curriculum/Day06_Local_Testing.md`](../curriculum/Day06_Local_Testing.md)：coverageとgas statisticsの実行手順。

## コマンド
```bash
npm run install:reviewed
npm test
npm run coverage
npm run gas
```

`npm run gas` は `hardhat --gas-stats test`、`npm run coverage` は `hardhat test --coverage` を実行する。追加pluginや外部RPCは使用しない。

## 取得した主な数値

実行環境: Node.js 22.22.2、Hardhat 3.11.0、Solidity 0.8.24。gas値はEVM・compiler設定・入力で変わるため、絶対値ではなく同一条件の差分として扱う。

| Contract | Method | Gas |
| --- | --- | ---: |
| GasBench | `benchSumMemory` | 123,543 |
| GasBench | `benchSumCalldata` | 91,860 |
| GasBench | `emitMany` | 28,941 |
| GasBench | `setS` | 43,579 |
| Hello | `setMessage` | 29,388 |

同じ入力で `benchSumCalldata` が `benchSumMemory` より小さくなり、「外部read-only入力はcalldataを優先する」という教材の説明を再現できた。

## 検証結果
- Hardhat Mocha tests: 16 passing
- Solidity coverage: total line 86.07%、statement 86.07%
- gas statistics: 関数別のMin / Average / Median / Max / callsを出力
- 外部RPC、秘密鍵、価格APIは未使用

## まとめ
1. memory / calldata / event costを同一lockfileとcompiler設定で比較できる。
2. Hardhat 2向けcoverage/gas reporter pluginを除去し、Hardhat 3組み込み機能へ移行した。
3. 数値は固定性能保証ではなく、変更前後の回帰検出に使う。
