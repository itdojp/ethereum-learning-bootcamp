import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Reentrancy scenario', () => {
  it('VulnBank is drainable', async () => {
    const [deployer, attackerSigner] = await ethers.getSigners();
    const bankFactory = await ethers.getContractFactory('VulnBank');
    const bank = await bankFactory.deploy();
    await bank.waitForDeployment();
    await bank.connect(deployer).dep({ value: ethers.parseEther('10') });

    const attackerFactory = await ethers.getContractFactory('Attacker');
    const attacker = await attackerFactory.connect(attackerSigner).deploy(await bank.getAddress());
    await attacker.waitForDeployment();

    await attacker.connect(attackerSigner).attack({ value: ethers.parseEther('1') });

    const bankBalance = await ethers.provider.getBalance(await bank.getAddress());
    expect(bankBalance).to.be.lessThan(ethers.parseEther('9'));
  });

  it('SafeBank resists reentrancy', async () => {
    const [deployer, attackerSigner] = await ethers.getSigners();
    const bankFactory = await ethers.getContractFactory('SafeBank');
    const bank = await bankFactory.deploy();
    await bank.waitForDeployment();
    await bank.connect(deployer).dep({ value: ethers.parseEther('10') });

    const attackerFactory = await ethers.getContractFactory('Attacker');
    const attacker = await attackerFactory.connect(attackerSigner).deploy(await bank.getAddress());
    await attacker.waitForDeployment();

    await expect(attacker.connect(attackerSigner).attack({ value: ethers.parseEther('1') }))
      .to.be.reverted;
  });
});
