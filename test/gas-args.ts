import { ethers } from 'hardhat';

describe('GasArgs', () => {
  it('compares calldata vs memory tx gas', async () => {
    const factory = await ethers.getContractFactory('GasArgs');
    const c = await factory.deploy();
    await c.waitForDeployment();
    const arr = Array.from({ length: 1000 }, (_, i) => BigInt(i + 1));

    const tx1 = await c.sumCalldataTx(arr);
    const r1 = await tx1.wait();
    const tx2 = await c.sumMemoryTx(arr);
    const r2 = await tx2.wait();
    console.log('gas-args calldata', r1?.gasUsed?.toString(), 'memory', r2?.gasUsed?.toString());
  });
});
