import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('MyToken', () => {
  it('runs approve/transferFrom flow', async () => {
    const [owner, spender, to] = await ethers.getSigners();
    const F = await ethers.getContractFactory('MyToken');
    const total = ethers.parseEther('100');
    const c = await F.deploy(total);
    await c.waitForDeployment();

    const allowanceAmount = ethers.parseEther('1');
    await expect(c.approve(spender.address, allowanceAmount))
      .to.emit(c, 'Approval')
      .withArgs(owner.address, spender.address, allowanceAmount);

    expect(await c.allowance(owner.address, spender.address)).to.eq(allowanceAmount);

    const transferAmount = ethers.parseEther('0.5');
    await expect(c.connect(spender).transferFrom(owner.address, to.address, transferAmount))
      .to.emit(c, 'Transfer')
      .withArgs(owner.address, to.address, transferAmount);

    expect(await c.balanceOf(to.address)).to.eq(transferAmount);
  });
});
