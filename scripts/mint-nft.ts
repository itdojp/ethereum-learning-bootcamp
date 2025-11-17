import { ethers } from 'hardhat';

async function main() {
  const nftAddress = process.env.NFT_ADDRESS;
  if (!nftAddress) throw new Error('NFT_ADDRESS env is required');
  const [owner, alice] = await ethers.getSigners();
  const abi = [
    'function mint(address,uint256)',
    'function tokenURI(uint256) view returns (string)'
  ];
  const c = new ethers.Contract(nftAddress, abi, owner);
  await (await c.mint(alice.address, 1)).wait();
  console.log('tokenURI:', await c.tokenURI(1));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
