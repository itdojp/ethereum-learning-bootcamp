import { ethers } from 'hardhat';

async function main() {
  const nftAddress = process.env.NFT_ADDRESS || process.env.NFT;
  if (!nftAddress) throw new Error('NFT_ADDRESS env is required');
  const signers = await ethers.getSigners();
  const owner = signers[0];
  if (!owner) throw new Error('no signer available');
  const to = process.env.TO || signers[1]?.address || owner.address;
  const tokenId = BigInt(process.env.TOKEN_ID || '1');
  const abi = [
    'function mint(address,uint256)',
    'function tokenURI(uint256) view returns (string)'
  ];
  const c = new ethers.Contract(nftAddress, abi, owner);
  await (await c.mint(to, tokenId)).wait();
  console.log('minted:', { to, tokenId: tokenId.toString() });
  console.log('tokenURI:', await c.tokenURI(tokenId));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
