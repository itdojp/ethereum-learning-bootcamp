import { ethers } from 'hardhat';

async function main() {
  const F = await ethers.getContractFactory('MyToken');
  const supply = ethers.parseEther('1000000');
  const c = await F.deploy(supply);
  await c.waitForDeployment();
  console.log('MTK:', await c.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
