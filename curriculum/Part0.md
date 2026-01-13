# Part 0：導入・環境（概要と進め方）

[← 目次](./TOC.md) | [前: 共通の前提](./README.md) | [次: Day1](./Day01_Ethereum_Intro.md)

このPartは「Ethereumを学び始める前提」をそろえる章だ。Day1〜Day3を通して、用語・手数料・開発環境までを一気に押さえる。

## このPartでできるようになること
- Ethereumの基本用語（ブロック、Tx、Gas、L1/L2）を最低限説明できる。
- RPCからネットワーク情報を取得し、数値の読み方（16進→10進）で迷わなくなる。
- Hardhat/Foundryを使って、ローカルでテストを回せる状態になる。

## このPartで扱わないこと（先に宣言）
- いきなりMainnetでTxを投げる（まずはローカル/テストネットで検証する）。
- いきなり複雑なDAppを作る（まずはコントラクトとテストの基礎を固める）。

## 最短ルート（迷ったらここだけ）
1) 共通の前提を読む：[`curriculum/README.md`](./README.md)  
2) Day1：全体像とRPC体験：[`Day01_Ethereum_Intro.md`](./Day01_Ethereum_Intro.md)  
3) Day2：GasとEIP‑1559：[`Day02_Transaction_Gas.md`](./Day02_Transaction_Gas.md)  
4) Day3：環境構築：[`Day03_Env_Setup.md`](./Day03_Env_Setup.md)

## チェックリスト（ここまでできれば次へ進める）
- [ ] `npm ci` が通る（ルート）
- [ ] `npm test` が通る（ルート）
- [ ] Day1のRPC例が動き、ブロック番号を10進数で読める

---

[← 目次](./TOC.md)

