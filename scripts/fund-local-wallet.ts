import { network } from 'hardhat';

const connection = await network.create();
const { ethers } = connection;

function requireAddress(value: string | undefined, label: string): string {
  if (!value || !ethers.isAddress(value) || value === ethers.ZeroAddress) {
    throw new Error(`${label} must be a non-zero Ethereum address`);
  }
  return ethers.getAddress(value);
}

async function main() {
  const networkInfo = await ethers.provider.getNetwork();
  if (connection.networkName !== 'localhost' || networkInfo.chainId !== 31337n) {
    throw new Error('This helper is restricted to --network localhost with chainId 31337');
  }

  const recipient = requireAddress(process.env.LOCAL_WALLET_ADDRESS, 'LOCAL_WALLET_ADDRESS');
  const tokenAddress = requireAddress(process.env.TOKEN_ADDRESS, 'TOKEN_ADDRESS');
  const ethAmount = process.env.LOCAL_ETH_AMOUNT || '10';
  const tokenAmount = process.env.LOCAL_TOKEN_AMOUNT || '1000';
  const [unlockedDeployer] = await ethers.getSigners();
  const ethValue = ethers.parseEther(ethAmount);
  if (ethValue <= 0n) {
    throw new Error('LOCAL_ETH_AMOUNT must be greater than zero');
  }

  if ((await ethers.provider.getCode(tokenAddress)) === '0x') {
    throw new Error('TOKEN_ADDRESS must contain an ERC-20 contract on localhost');
  }

  const token = await ethers.getContractAt(
    [
      'function decimals() view returns (uint8)',
      'function balanceOf(address owner) view returns (uint256)',
      'function transfer(address to, uint256 value) returns (bool)'
    ],
    tokenAddress,
    unlockedDeployer
  );
  const decimals = await token.decimals();
  const tokenValue = ethers.parseUnits(tokenAmount, decimals);
  if (tokenValue <= 0n) {
    throw new Error('LOCAL_TOKEN_AMOUNT must be greater than zero');
  }

  // Complete every predictable validation before broadcasting either
  // transaction so an invalid token request cannot leave an ETH-only result.
  const deployerAddress = await unlockedDeployer.getAddress();
  const deployerTokenBalance = await token.balanceOf(deployerAddress);
  if (deployerTokenBalance < tokenValue) {
    throw new Error('The localhost deployer does not have enough tokens to fund the wallet');
  }
  if (!(await token.transfer.staticCall(recipient, tokenValue))) {
    throw new Error('The ERC-20 transfer preflight returned false');
  }

  const feeData = await ethers.provider.getFeeData();
  let feeOverrides:
    | { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
    | { gasPrice: bigint };
  let feePerGas: bigint;
  if (feeData.maxFeePerGas !== null) {
    feePerGas = feeData.maxFeePerGas;
    feeOverrides = {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 0n
    };
  } else if (feeData.gasPrice !== null) {
    feePerGas = feeData.gasPrice;
    feeOverrides = { gasPrice: feeData.gasPrice };
  } else {
    throw new Error('Unable to determine localhost transaction fees');
  }
  const ethGasLimit = await unlockedDeployer.estimateGas({
    to: recipient,
    value: ethValue,
    ...feeOverrides
  });
  const tokenGasLimit = await token.transfer.estimateGas(recipient, tokenValue, feeOverrides);
  const requiredEthBalance = ethValue + (ethGasLimit + tokenGasLimit) * feePerGas;
  if ((await ethers.provider.getBalance(deployerAddress)) < requiredEthBalance) {
    throw new Error('The localhost deployer cannot cover both transfers and their maximum fees');
  }

  const ethTransaction = await unlockedDeployer.sendTransaction({
    to: recipient,
    value: ethValue,
    gasLimit: ethGasLimit,
    ...feeOverrides
  });
  await ethTransaction.wait();

  const tokenTransaction = await token.transfer(recipient, tokenValue, {
    gasLimit: tokenGasLimit,
    ...feeOverrides
  });
  await tokenTransaction.wait();

  console.log(`Funded local learning wallet ${recipient}`);
  console.log(`ETH amount: ${ethAmount}; token amount: ${tokenAmount}; chainId: ${networkInfo.chainId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
