import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.create();

describe('Hello', ()=>{
  it('sets and emits', async ()=>{
    const F = await ethers.getContractFactory('Hello');
    const c = await F.deploy();
    await c.waitForDeployment();
    await expect(c.setMessage('OK')).to.emit(c, 'MessageChanged');
    expect(await c.message()).to.eq('OK');
  });
});
