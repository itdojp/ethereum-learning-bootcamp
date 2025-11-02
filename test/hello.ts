import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Hello', ()=>{
  it('sets and emits', async ()=>{
    const F = await ethers.getContractFactory('Hello');
    const c = await F.deploy();
    await c.deployed();
    await expect(c.setMessage('OK')).to.emit(c, 'MessageChanged');
    expect(await c.message()).to.eq('OK');
  });
});
