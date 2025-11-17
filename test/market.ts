import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('FixedPriceMarket', () => {
  it('lists and purchases NFT', async () => {
    const [owner, buyer] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory('MyNFT');
    const nft = await NFT.deploy('ipfs://cid/', owner.address, 500);
    await nft.waitForDeployment();
    await (await nft.mint(owner.address, 1)).wait();

    const Market = await ethers.getContractFactory('FixedPriceMarket');
    const market = await Market.deploy();
    await market.waitForDeployment();

    await (await nft.setApprovalForAll(await market.getAddress(), true)).wait();

    const price = ethers.parseEther('0.1');
    await expect(market.list(await nft.getAddress(), 1, price))
      .to.emit(market, 'Listed')
      .withArgs(await nft.getAddress(), 1, owner.address, price);

    await expect(market.connect(buyer).buy(await nft.getAddress(), 1, { value: price }))
      .to.emit(market, 'Purchased')
      .withArgs(await nft.getAddress(), 1, buyer.address, price);

    expect(await nft.ownerOf(1)).to.eq(buyer.address);
  });
});
