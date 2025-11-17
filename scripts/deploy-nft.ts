import { ethers } from 'hardhat';

async function main() {
  const base = process.env.NFT_BASE || 'ipfs://example/';
  const royaltyBps = Number(process.env.NFT_ROYALTY_BPS || 500);
  const [owner] = await ethers.getSigners();
  const F = await ethers.getContractFactory('MyNFT');
  const c = await F.deploy(base, owner.address, royaltyBps);
  await c.waitForDeployment();
  console.log('MyNFT:', await c.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
