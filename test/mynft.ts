import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.create();

describe('MyNFT', () => {
  it('mints, returns tokenURI, and signals ERC-2981 royalty information', async () => {
    const [owner, alice] = await ethers.getSigners();
    const F = await ethers.getContractFactory('MyNFT');
    const base = 'ipfs://cid/';
    const c = await F.deploy(base, owner.address, 500);
    await c.waitForDeployment();
    await (await c.mint(alice.address, 1)).wait();
    expect(await c.tokenURI(1)).to.eq(`${base}1.json`);
    expect(await c.supportsInterface('0x2a55205a')).to.eq(true);

    const salePrice = ethers.parseEther('1');
    const [receiver, royaltyAmount] = await c.royaltyInfo(1, salePrice);
    expect(receiver).to.eq(owner.address);
    expect(royaltyAmount).to.eq(ethers.parseEther('0.05'));
  });

  it('rejects the zero address as royalty receiver', async () => {
    const F = await ethers.getContractFactory('MyNFT');

    await expect(F.deploy('ipfs://cid/', ethers.ZeroAddress, 500))
      .to.be.revertedWithCustomError(F, 'InvalidRoyaltyReceiver')
      .withArgs(ethers.ZeroAddress);
  });

  it('rejects royalty basis points above 10000', async () => {
    const [owner] = await ethers.getSigners();
    const F = await ethers.getContractFactory('MyNFT');

    await expect(F.deploy('ipfs://cid/', owner.address, 10_001))
      .to.be.revertedWithCustomError(F, 'InvalidRoyaltyBps')
      .withArgs(10_001);
  });

  it('accepts the 10000 bps boundary', async () => {
    const [owner] = await ethers.getSigners();
    const F = await ethers.getContractFactory('MyNFT');
    const c = await F.deploy('ipfs://cid/', owner.address, 10_000);
    await c.waitForDeployment();

    const salePrice = ethers.parseEther('1');
    const [receiver, royaltyAmount] = await c.royaltyInfo(1, salePrice);
    expect(receiver).to.eq(owner.address);
    expect(royaltyAmount).to.eq(salePrice);
  });
});
