import { ethers } from 'hardhat';

describe('GasEvent', () => {
  it('logs gas difference', async () => {
    const factory = await ethers.getContractFactory('GasEvent');
    const c = await factory.deploy();
    await c.waitForDeployment();
    const [caller, other] = await ethers.getSigners();

    const tx1 = await c.connect(caller).e1(1);
    const r1 = await tx1.wait();
    const tx2 = await c.connect(caller).e2(other.address, 1);
    const r2 = await tx2.wait();
    console.log('gas-event e1', r1?.gasUsed?.toString(), 'e2', r2?.gasUsed?.toString());
  });
});
