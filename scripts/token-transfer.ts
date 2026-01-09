import { ethers } from 'hardhat';

async function main() {
  const tokenAddress = process.env.TOKEN;
  if (!tokenAddress) throw new Error('TOKEN env is required');
  const signers = await ethers.getSigners();
  const owner = signers[0];
  if (!owner) throw new Error('no signer available');
  const to = process.env.TO || signers[1]?.address || owner.address;
  const abi = [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address,uint256) returns (bool)'
  ];
  const c = new ethers.Contract(tokenAddress, abi, owner);
  console.log('owner before:', (await c.balanceOf(owner.address)).toString());
  const amount = ethers.parseEther('10');
  const tx = await c.transfer(to, amount);
  await tx.wait();
  console.log('to:', to);
  console.log('to after:', (await c.balanceOf(to)).toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
