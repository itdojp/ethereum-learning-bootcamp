import { ethers } from 'hardhat';

async function main() {
  const F = await ethers.getContractFactory('WalletBox');
  const c = await F.deploy('hello');
  await c.waitForDeployment();
  console.log('WalletBox:', await c.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
