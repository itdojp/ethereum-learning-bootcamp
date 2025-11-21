import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('GasPack', () => {
  it('packed struct saves gas', async () => {
    const naiveFactory = await ethers.getContractFactory('GasNaive');
    const packedFactory = await ethers.getContractFactory('GasPacked');
    const naive = await naiveFactory.deploy();
    const packed = await packedFactory.deploy();
    await Promise.all([naive.waitForDeployment(), packed.waitForDeployment()]);

    const tx1 = await naive.add(1_000_000, 100);
    const r1 = await tx1.wait();
    const tx2 = await packed.add(1_000_000, 100);
    const r2 = await tx2.wait();

    console.log('gas-pack add naive', r1?.gasUsed?.toString(), 'packed', r2?.gasUsed?.toString());
    expect(r2?.gasUsed).to.be.lt(r1?.gasUsed || 0n);
  });
});
