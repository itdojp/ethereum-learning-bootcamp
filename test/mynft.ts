import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('MyNFT', () => {
  it('mints and returns tokenURI', async () => {
    const [owner, alice] = await ethers.getSigners();
    const F = await ethers.getContractFactory('MyNFT');
    const base = 'ipfs://cid/';
    const c = await F.deploy(base, owner.address, 500);
    await c.waitForDeployment();
    await (await c.mint(alice.address, 1)).wait();
    expect(await c.tokenURI(1)).to.eq(`${base}1`);
  });
});
