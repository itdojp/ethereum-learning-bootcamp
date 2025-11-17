import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('WalletBox', () => {
  it('deploys with owner and note', async () => {
    const [owner] = await ethers.getSigners();
    const F = await ethers.getContractFactory('WalletBox');
    const c = await F.deploy('init');
    await c.waitForDeployment();
    expect(await c.note()).to.eq('init');
    expect(await c.owner()).to.eq(owner.address);
  });

  it('reverts on empty note and emits on change', async () => {
    const [, alice] = await ethers.getSigners();
    const c = await (await ethers.getContractFactory('WalletBox')).deploy('n');
    await c.waitForDeployment();
    await expect(c.setNote('')).to.be.revertedWithCustomError(c, 'EmptyMessage');
    await expect(c.connect(alice).setNote('ok')).to.emit(c, 'NoteChanged').withArgs(alice.address, 'ok');
  });

  it('accepts ether and allows owner withdraw', async () => {
    const [owner, alice] = await ethers.getSigners();
    const c = await (await ethers.getContractFactory('WalletBox')).deploy('n');
    await c.waitForDeployment();
    const address = await c.getAddress();
    const deposit = ethers.parseEther('0.1');
    await owner.sendTransaction({ to: address, value: deposit });
    expect(await c.balance()).to.eq(deposit);

    await expect(c.connect(alice).withdraw(alice.address, 1n)).to.be.revertedWithCustomError(c, 'NotOwner');

    const withdrawAmount = ethers.parseEther('0.05');
    await expect(c.withdraw(owner.address, withdrawAmount))
      .to.emit(c, 'Withdrawn')
      .withArgs(owner.address, withdrawAmount);
  });
});
