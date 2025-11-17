import { ethers } from 'hardhat';

async function main() {
  const tokenAddress = process.env.TOKEN;
  if (!tokenAddress) throw new Error('TOKEN env is required');
  const [owner, bob] = await ethers.getSigners();
  const abi = [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address,uint256) returns (bool)'
  ];
  const c = new ethers.Contract(tokenAddress, abi, owner);
  console.log('owner before:', (await c.balanceOf(owner.address)).toString());
  const amount = ethers.parseEther('10');
  const tx = await c.transfer(bob.address, amount);
  await tx.wait();
  console.log('bob after:', (await c.balanceOf(bob.address)).toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
