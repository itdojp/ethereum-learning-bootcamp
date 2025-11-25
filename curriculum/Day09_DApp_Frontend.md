# Day9：DAppフロント（React + ethers）— ウォレット接続／ネットワーク切替／残高・送金UI

## 学習目的
- ブラウザからMetaMask等に接続し、アカウント・ネットワークを取得。
- ネットワーク切替（Sepolia/Optimism）とエラー処理を実装。
- ETH残高、ERC‑20残高の表示と送金UIを作成。

---

## 0. 前提
- `eth-bootcamp/` 直下にHardhatプロジェクトがある。
- Day5で発行したERC‑20（`MyToken`）の**アドレス**あり。

`.env.sample`（ルート）に以下を追加：
```
VITE_TOKEN_ADDRESS=0x...
VITE_CHAIN_ID=11155111         # sepolia (11155111) / optimism (10)
VITE_RPC=https://sepolia.infura.io/v3/<KEY>
```

---

## 1. プロジェクト作成（Vite + React + TypeScript）
```bash
cd eth-bootcamp
npm create vite@latest dapp -- --template react-ts
cd dapp
npm i ethers
npm i -D vite-plugin-node-polyfills
```
`vite.config.ts`（Nodeポリフィル。ethers v6は基本不要だが互換性のため）
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
export default defineConfig({
  plugins: [react(), nodePolyfills()],
});
```
起動：
```bash
npm run dev
```

---

## 2. UI実装（Connect / Network / Balance / ERC‑20 Transfer）
`src/lib/web3.ts`（ユーティリティ）
```ts
import { ethers } from 'ethers';
export type Web3Ctx = { provider: ethers.BrowserProvider|null, signer: ethers.Signer|null };
export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (!(window as any).ethereum) throw new Error('No injected provider');
  return new ethers.BrowserProvider((window as any).ethereum);
}
export async function requestAccounts(p: ethers.BrowserProvider){
  await (p as any).send('eth_requestAccounts', []);
}
export async function getSigner(p: ethers.BrowserProvider){
  return await p.getSigner();
}
export async function getChainId(p: ethers.BrowserProvider){
  const n = await p.getNetwork();
  return Number(n.chainId);
}
export async function switchChain(hexChainId: string){
  await (window as any).ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: hexChainId }]
  });
}
export function toHexChain(id: number){ return '0x'+id.toString(16); }
```

`src/App.tsx`
```tsx
import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { getProvider, requestAccounts, getSigner, getChainId, switchChain, toHexChain } from './lib/web3';

const TOKEN_ADDR = import.meta.env.VITE_TOKEN_ADDRESS as string;
const ABI_ERC20 = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

export default function App(){
  const [provider, setProvider] = useState<ethers.BrowserProvider|null>(null);
  const [signer, setSigner] = useState<ethers.Signer|null>(null);
  const [account, setAccount] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [tokenMeta, setTokenMeta] = useState<{decimals:number, symbol:string}>({decimals:18, symbol:'TKN'});
  const [to, setTo] = useState('');
  const [amt, setAmt] = useState('');
  const desired = Number(import.meta.env.VITE_CHAIN_ID || 11155111);

  const token = useMemo(()=>{
    return signer && TOKEN_ADDR ? new ethers.Contract(TOKEN_ADDR, ABI_ERC20, signer) : null;
  }, [signer]);

  async function connect(){
    try{
      const p = await getProvider();
      await requestAccounts(p);
      const s = await getSigner(p);
      const addr = await s.getAddress();
      const cid = await getChainId(p);
      setProvider(p); setSigner(s); setAccount(addr); setChainId(cid);
    }catch(e:any){ alert('connect failed: '+e.message); }
  }

  async function ensureNetwork(){
    if(!provider) return;
    const cid = await getChainId(provider);
    if(cid !== desired){
      try{ await switchChain(toHexChain(desired)); setChainId(desired); }
      catch(e:any){ alert('network switch failed: '+e.message); }
    }
  }

  async function refresh(){
    if(!provider || !signer) return;
    const addr = await signer.getAddress();
    const bal = await provider.getBalance(addr);
    setEthBalance(ethers.formatEther(bal));
    if(token){
      const [dec, sym] = await Promise.all([token.decimals(), token.symbol()]);
      const raw = await token.balanceOf(addr);
      setTokenMeta({decimals:Number(dec), symbol:sym});
      setTokenBalance(ethers.formatUnits(raw, Number(dec)));
    }
  }

  async function sendToken(){
    if(!token) return;
    try{
      const value = ethers.parseUnits(amt, tokenMeta.decimals);
      const tx = await token.transfer(to, value);
      const r = await tx.wait();
      alert('sent: '+r?.hash);
      await refresh();
    }catch(e:any){ alert('transfer failed: '+e.message); }
  }

  useEffect(()=>{
    if((window as any).ethereum){
      (window as any).ethereum.on('accountsChanged', ()=>location.reload());
      (window as any).ethereum.on('chainChanged', ()=>location.reload());
    }
  },[]);

  return (
    <div style={{maxWidth:720, margin:'40px auto', fontFamily:'sans-serif'}}>
      <h1>DApp Starter</h1>
      <div style={{display:'flex', gap:8}}>
        <button onClick={connect}>Connect Wallet</button>
        <button onClick={ensureNetwork}>Switch to Chain {desired}</button>
        <button onClick={refresh}>Refresh</button>
      </div>
      <p>Account: {account || '(not connected)'} / ChainId: {chainId||'-'}</p>
      <p>ETH Balance: {ethBalance}</p>
      <p>{tokenMeta.symbol} Balance: {tokenBalance}</p>
      <hr />
      <h3>Send {tokenMeta.symbol}</h3>
      <div style={{display:'grid', gap:6}}>
        <input placeholder='to address' value={to} onChange={e=>setTo(e.target.value)} />
        <input placeholder='amount' value={amt} onChange={e=>setAmt(e.target.value)} />
        <button onClick={sendToken}>Send</button>
      </div>
    </div>
  );
}
```

`src/main.tsx`
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

起動：
```bash
npm run dev
```
ブラウザで `http://localhost:5173` を開き、
1) Connect Wallet → 2) Switch to Chain → 3) Refresh の順に操作。

---

## 3. ネットワーク設定（参考）
| チェーン | chainId | 例RPC |
|---|---:|---|
| Sepolia | 11155111 | https://sepolia.infura.io/v3/KEY |
| Optimism | 10 | https://optimism-mainnet.infura.io/v3/KEY |

`VITE_CHAIN_ID` を切り替えて確認。

---

## 4. エラー処理パターン
- `No injected provider`：MetaMask未導入。Chrome拡張を案内。
- `network switch failed`：対象チェーン未登録。`wallet_addEthereumChain` で登録実装を追加。
- `insufficient funds`：手数料不足。少額ETH補充。

登録用ヘルパ（任意）：
```ts
export async function addChain(params:any){
  await (window as any).ethereum.request({ method:'wallet_addEthereumChain', params:[params] });
}
```

---

## 5. 最低限のアクセシビリティ
- ボタンのラベルは動詞で統一。
- 入力値は正規表現で検証（0以上、小数点桁数 ≤ decimals）。
- 失敗時アラートの代わりにトースト（任意のUIライブラリ）を採用。

---

## 6. 追加課題
- `permit(EIP‑2612)`対応トランスファ（署名→中継）をUIに追加。
- 残高と履歴の取得をThe Graph（Day10）で高速化。
- Wagmi + viem 版の実装に置換し、React Hooksで状態管理を簡素化。

---

## 7. 提出物
- 稼働中スクリーンショット（接続・チェーンID・残高表示）。
- `VITE_*`設定値（鍵等は伏せる）と、動作確認ネットワークの記録。
- トランザクションハッシュ（送金実績）。
