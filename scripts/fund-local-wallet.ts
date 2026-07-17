import { ethers, network } from 'hardhat';

function requireAddress(value: string | undefined, label: string): string {
  if (!value || !ethers.isAddress(value) || value === ethers.ZeroAddress) {
    throw new Error(`${label} must be a non-zero Ethereum address`);
  }
  return ethers.getAddress(value);
}

async function main() {
  const networkInfo = await ethers.provider.getNetwork();
  if (network.name !== 'localhost' || networkInfo.chainId !== 31337n) {
    throw new Error('This helper is restricted to --network localhost with chainId 31337');
  }

  const recipient = requireAddress(process.env.LOCAL_WALLET_ADDRESS, 'LOCAL_WALLET_ADDRESS');
  const tokenAddress = requireAddress(process.env.TOKEN_ADDRESS, 'TOKEN_ADDRESS');
  const ethAmount = process.env.LOCAL_ETH_AMOUNT || '10';
  const tokenAmount = process.env.LOCAL_TOKEN_AMOUNT || '1000';
  const [unlockedDeployer] = await ethers.getSigners();

  const ethTransaction = await unlockedDeployer.sendTransaction({
    to: recipient,
    value: ethers.parseEther(ethAmount)
  });
  await ethTransaction.wait();

  const token = await ethers.getContractAt(
    [
      'function decimals() view returns (uint8)',
      'function transfer(address to, uint256 value) returns (bool)'
    ],
    tokenAddress,
    unlockedDeployer
  );
  const decimals = await token.decimals();
  const tokenTransaction = await token.transfer(
    recipient,
    ethers.parseUnits(tokenAmount, decimals)
  );
  await tokenTransaction.wait();

  console.log(`Funded local learning wallet ${recipient}`);
  console.log(`ETH amount: ${ethAmount}; token amount: ${tokenAmount}; chainId: ${networkInfo.chainId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
