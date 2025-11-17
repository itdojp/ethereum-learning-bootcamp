import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('EventToken', () => {
  it('mints and emits TransferLogged', async () => {
    const [owner, bob] = await ethers.getSigners();
    const F = await ethers.getContractFactory('EventToken');
    const c = await F.deploy();
    await c.waitForDeployment();
    await (await c.mint(1000n)).wait();
    await expect(c.transfer(bob.address, 123n))
      .to.emit(c, 'TransferLogged')
      .withArgs(owner.address, bob.address, 123n);
    expect(await c.bal(owner.address)).to.eq(877n);
    expect(await c.bal(bob.address)).to.eq(123n);
  });
});
