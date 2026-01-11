# Day09 実行ログ（2026-01 更新）

## 変更点（教材改訂後）
- DApp は `dapp/` に同梱（新規 `npm create vite` は不要）。
- Vite の環境変数は `dapp/.env.local` を使う（`VITE_*`）。

## 実行
```bash
cd dapp
npm ci
npm run build
```

### 結果（抜粋）
- `tsc && vite build` が成功。
- 生成物：
  - `dist/index.html`：0.32 kB
  - `dist/assets/index-*.js`：402.25 kB（gzip: 142.68 kB）

## 次に行うとよい確認（ブラウザ必須）
1) `cp dapp/.env.example dapp/.env.local`  
2) `dapp/.env.local` に `VITE_CHAIN_ID` / `VITE_TOKEN_ADDRESS` を設定  
3) `npm run dev` で `http://localhost:5173` を開き、Connect/Switch/Refresh/Send を確認

## 補足
- `npm audit`：0 vulnerabilities を確認。
