import { ethers, network } from 'hardhat';

async function main(){
  const name = process.env.CONTRACT || 'Hello';
  const args = (process.env.ARGS||'').split(' ').filter(Boolean);
  console.log('network:', network.name, 'contract:', name, 'args:', args);
  const F = await ethers.getContractFactory(name);
  const c = await F.deploy(...(args as any));
  await c.waitForDeployment();
  console.log('deployed:', await c.getAddress());
}
main().catch((e)=>{ console.error(e); process.exit(1); });
