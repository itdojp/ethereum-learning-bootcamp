import { expect } from 'chai';
import { ethers } from 'hardhat';

const arr = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('GasBench', () => {
  it('storage write vs read-only ops', async () => {
    const F = await ethers.getContractFactory('GasBench');
    const c = await F.deploy();
    await c.waitForDeployment();
    const tx = await c.setS(123);
    await tx.wait();
    expect(await c.s()).to.eq(123);
  });

  it('memory vs calldata benches appear in gasReporter', async () => {
    const F = await ethers.getContractFactory('GasBench');
    const c = await F.deploy();
    await c.waitForDeployment();
    const values = arr(200);
    await (await c.benchSumMemory(values)).wait();
    await (await c.benchSumCalldata(values)).wait();
  });

  it('event emission cost', async () => {
    const F = await ethers.getContractFactory('GasBench');
    const c = await F.deploy();
    await c.waitForDeployment();
    await (await c.emitMany(5)).wait();
  });
});
