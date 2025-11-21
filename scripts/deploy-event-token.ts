import { ethers } from 'hardhat';

async function main() {
  const F = await ethers.getContractFactory('EventToken');
  const c = await F.deploy();
  await c.waitForDeployment();
  console.log('EventToken:', await c.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
