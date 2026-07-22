import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.create();

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

  it('measures memory and calldata transaction paths', async () => {
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
