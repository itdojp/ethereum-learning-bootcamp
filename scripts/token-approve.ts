import { ethers } from 'hardhat';

async function main() {
  const tokenAddress = process.env.TOKEN;
  if (!tokenAddress) throw new Error('TOKEN env is required');
  const [owner, spender, to] = await ethers.getSigners();
  const abi = [
    'function approve(address,uint256) returns (bool)',
    'function allowance(address,address) view returns (uint256)',
    'function transferFrom(address,address,uint256) returns (bool)',
    'event Approval(address indexed,address indexed,uint256)'
  ];
  const ownerContract = new ethers.Contract(tokenAddress, abi, owner);
  const spenderContract = new ethers.Contract(tokenAddress, abi, spender);

  const allowanceAmount = ethers.parseEther('1');
  await (await ownerContract.approve(spender.address, allowanceAmount)).wait();
  console.log('allowance:', (await ownerContract.allowance(owner.address, spender.address)).toString());

  const transferAmount = ethers.parseEther('0.5');
  await (await spenderContract.transferFrom(owner.address, to.address, transferAmount)).wait();
  console.log('transferFrom complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
