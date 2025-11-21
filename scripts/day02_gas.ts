import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('deployer:', deployer.address);
  const GasTest = await ethers.getContractFactory('GasTest');
  const c = await GasTest.deploy();
  await c.waitForDeployment();
  console.log('GasTest deployed at', await c.getAddress());

  const storeTx = await c.store(123);
  const storeReceipt = await storeTx.wait();
  console.log('store tx:', storeTx.hash);
  console.log('store gasUsed:', storeReceipt?.gasUsed?.toString());

  const addCalldata = c.interface.encodeFunctionData('add', [10, 20]);
  const addTx = await deployer.sendTransaction({
    to: await c.getAddress(),
    data: addCalldata
  });
  const addReceipt = await addTx.wait();
  console.log('add tx:', addTx.hash);
  console.log('add gasUsed:', addReceipt?.gasUsed?.toString());

  const rewriteTx = await c.testRewrite(123);
  const rewriteReceipt = await rewriteTx.wait();
  console.log('testRewrite tx:', rewriteTx.hash);
  console.log('testRewrite gasUsed:', rewriteReceipt?.gasUsed?.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
