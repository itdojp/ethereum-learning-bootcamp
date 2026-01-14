# Glossary

このページは用語集だ。迷ったらまずここに戻る。  
素早く探したい場合は、このページ内検索（`Ctrl+F` / `Cmd+F`）を使う。

## 基礎（Ethereum）
- ABI: コントラクトを呼び出すための「関数/引数/型」の情報（JSONなど）。dapp や The Graph で必要になる。
- chainId: ネットワーク識別子。Hardhatの `--network` や、dapp の `VITE_CHAIN_ID` で参照する。
- EIP（Ethereum Improvement Proposal）: Ethereumの仕様変更提案。採用されると、ネットワークやツールの前提が変わる。
- ERC（Ethereum Request for Comments）: Ethereum上の標準規格（例：ERC‑20, ERC‑721）。
- EIP‑1559: 手数料が `baseFee + priority fee` を軸に調整される仕組み。Tx受領では `effectiveGasPrice` に反映される。
- Event（イベントログ）: コントラクトが `emit` で出すログ。状態とは別に記録され、購読や検索に使う。
- EVM（Ethereum Virtual Machine）: コントラクト実行環境。コード実行やガス計算の前提になる。
- Gas: Tx実行で消費する計算/保存コストの単位。概ね `fee = gasUsed * effectiveGasPrice`（wei）で手数料を計算する。
- calldata: 外部関数の入力データ領域（読み取り専用）。不要なコピーを避けるとガスを抑えやすい。
- memory: 一時的な作業領域。加工に便利だが、展開/コピーが増えるとコストが上がりやすい。
- storage: コントラクトの永続状態。書き込み（`SSTORE`）は高コストになりやすい。
- Topic: イベントログの索引用データ。`indexed` を付けた引数がtopicになり、フィルタしやすくなる。
- RPC（JSON-RPC endpoint）: Ethereumノードと通信するためのエンドポイント。`eth_blockNumber` などのメソッドをHTTP/WSで呼び出す。
- Tx（Transaction）: トランザクションの略。送金やコントラクト呼び出しなど、状態を変える操作の実行単位。
- Finality: 取り消されないとみなせる確定性。

## L1/L2・スケーリング
- L1: ベースレイヤ（例：Ethereum mainnet）。主に安全性を担う。
- L2: スケーリング用レイヤ。主に処理量（スループット）改善を担う。
- Blob（EIP‑4844）: ロールアップがL1へ投稿するデータを、calldataより安価に扱うための仕組み（blob-carrying transactions）。L2手数料の「L1データ可用性（DA）」コストに直結する。
- Data Availability（DA）: 誰でも検証できるよう必要データが公開され続ける性質。
- EIP‑7691: Blob throughput increase。blob の target/max（1ブロックあたりの目安/上限）を 3/6 → 6/9 に増やす。
- Bridge: L1/L2間で資産を移す仕組み。
- Sequencer: L2でトランザクション順序を決める役割。
- Fraud Proof: Optimisticで不正を検知する異議申立て証明。
- Validity Proof: ZKで正当性を示す暗号学的証明。

## アカウント・AA
- Account Abstraction（AA）: ウォレット（アカウント）に、バッチ実行やガス代スポンサーなどの“プログラム可能な”機能を持たせる考え方。
- EOA（Externally Owned Account）: 秘密鍵で制御されるアカウント。従来は「コードを持たない」と説明されることが多いが、EIP‑7702 により委任（delegation indicator）を持つ可能性がある。
- Delegation indicator（EIP‑7702）: EOAが設定できる“委任先マーカー”。実行時に別アドレスのコードへ委譲して動く挙動が入り得る。
- EntryPoint（ERC‑4337）: AAの実行基盤となるコントラクト。BundlerがUserOperationをまとめて呼び出す。
- Bundler（ERC‑4337）: UserOperationを集めてトランザクション化し、EntryPointへ送る中継者。
- UserOperation（ERC‑4337）: 4337系AAでユーザーが署名する「実行依頼」データ。BundlerがTxにまとめる。
- Meta-Transaction（EIP‑2771）: 代理実行でユーザーのガス負担を軽減する仕組み。
- Permit（EIP‑2612）: 署名承認によるトークン許可方式。

## 開発・運用・外部サービス
- CI（Continuous Integration）: Pull Request などを契機にテストを自動実行し、差分の不具合を早期に検出する仕組み。
- Verify（ソース検証）: エクスプローラ上で、ソースコードとデプロイ済みバイトコードを対応付ける作業。
- Etherscan: Ethereum系チェーンのブロックエクスプローラ。トランザクションやコントラクト、Verify（ソース検証）の確認に使う。
- Blockscout: Etherscan系ではないブロックエクスプローラ実装の一つ。L2で採用されることがある。
- The Graph: コントラクトのイベント等をインデックス化し、GraphQLで検索・取得できるようにする仕組み/サービス。
- Subgraph: The Graph の「インデックス定義」。どのコントラクトのどのイベントを、どの形で保存するかを宣言する。
- GraphQL: The Graph などで使われるクエリ言語。必要な項目だけを問い合わせられる。
