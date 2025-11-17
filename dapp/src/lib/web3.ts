import { ethers } from 'ethers';

export type Web3Ctx = { provider: ethers.BrowserProvider | null; signer: ethers.Signer | null };

export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (!(window as any).ethereum) throw new Error('No injected provider detected');
  return new ethers.BrowserProvider((window as any).ethereum);
}

export async function requestAccounts(provider: ethers.BrowserProvider) {
  await (provider as any).send('eth_requestAccounts', []);
}

export async function getSigner(provider: ethers.BrowserProvider) {
  return provider.getSigner();
}

export async function getChainId(provider: ethers.BrowserProvider) {
  const network = await provider.getNetwork();
  return Number(network.chainId);
}

export async function switchChain(chainIdHex: string) {
  await (window as any).ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: chainIdHex }]
  });
}

export function toHexChain(id: number) {
  return `0x${id.toString(16)}`;
}
