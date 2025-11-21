import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { getProvider, requestAccounts, getSigner, getChainId, switchChain, toHexChain } from './lib/web3';
import { useTransferEvents } from './hooks/useEvents';

const TOKEN_ADDR = (import.meta.env.VITE_TOKEN_ADDRESS as string) || '';
const DESIRED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? 31337);
const EVENT_TOKEN = (import.meta.env.VITE_EVENT_TOKEN as string) || '';
const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address,uint256) returns (bool)'
];

export default function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState<number>();
  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenMeta, setTokenMeta] = useState({ decimals: 18, symbol: 'TKN' });
  const [sendTo, setSendTo] = useState('');
  const [amount, setAmount] = useState('');

  const token = useMemo(() => {
    if (!signer || !TOKEN_ADDR) return null;
    return new ethers.Contract(TOKEN_ADDR, TOKEN_ABI, signer);
  }, [signer]);

  const events = useTransferEvents(EVENT_TOKEN);

  async function connectWallet() {
    try {
      const p = await getProvider();
      await requestAccounts(p);
      const s = await getSigner(p);
      const addr = await s.getAddress();
      const cid = await getChainId(p);
      setProvider(p);
      setSigner(s);
      setAccount(addr);
      setChainId(cid);
    } catch (error: any) {
      alert(`Connect failed: ${error.message}`);
    }
  }

  async function ensureNetwork() {
    if (!provider) return;
    const cid = await getChainId(provider);
    if (cid !== DESIRED_CHAIN_ID) {
      try {
        await switchChain(toHexChain(DESIRED_CHAIN_ID));
        setChainId(DESIRED_CHAIN_ID);
      } catch (error: any) {
        alert(`Network switch failed: ${error.message}`);
      }
    }
  }

  async function refreshBalances() {
    if (!provider || !signer) return;
    const addr = await signer.getAddress();
    const bal = await provider.getBalance(addr);
    setEthBalance(ethers.formatEther(bal));
    if (token) {
      const [decimals, symbol] = await Promise.all([token.decimals(), token.symbol()]);
      const raw = await token.balanceOf(addr);
      const dec = Number(decimals);
      setTokenMeta({ decimals: dec, symbol });
      setTokenBalance(ethers.formatUnits(raw, dec));
    }
  }

  async function sendToken() {
    if (!token) {
      alert('Token contract not configured');
      return;
    }
    try {
      const value = ethers.parseUnits(amount || '0', tokenMeta.decimals);
      const tx = await token.transfer(sendTo, value);
      const receipt = await tx.wait();
      alert(`Transfer success: ${receipt?.hash}`);
      await refreshBalances();
    } catch (error: any) {
      alert(`Transfer failed: ${error.message}`);
    }
  }

  useEffect(() => {
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', () => window.location.reload());
      (window as any).ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '32px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>DApp Frontend</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={connectWallet}>Connect Wallet</button>
        <button onClick={ensureNetwork}>Switch to Chain {DESIRED_CHAIN_ID}</button>
        <button onClick={refreshBalances}>Refresh Balances</button>
      </div>
      <p>Account: {account || '(not connected)'} | ChainId: {chainId ?? '-'}</p>
      <p>ETH Balance: {ethBalance}</p>
      <p>
        {tokenMeta.symbol} Balance: {tokenBalance}
      </p>
      {EVENT_TOKEN ? (
        <div>
          <h3>Recent TransferLogged events</h3>
          <ul>
            {events.map((log, idx) => (
              <li key={`${log.txHash ?? ''}-${idx}`}>
                #{log.blockNumber}: {log.from} → {log.to} ({log.amount})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ fontStyle: 'italic' }}>Set VITE_EVENT_TOKEN to enable event streaming.</p>
      )}
      <hr />
      <h3>Send {tokenMeta.symbol}</h3>
      <div style={{ display: 'grid', gap: 6 }}>
        <input placeholder="to" value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
        <input placeholder="amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button onClick={sendToken}>Send</button>
      </div>
    </div>
  );
}
