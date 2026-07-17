import { ethers, network } from 'hardhat';

const {
  parseConstructorArgs,
  validateContractName
}: {
  parseConstructorArgs: (value: string) => unknown[];
  validateContractName: (value: string) => string;
} = require('../tools/deploy-inputs.cjs');

async function main() {
  if (process.env.ARGS !== undefined) {
    throw new Error('ARGS is no longer accepted; use ARGS_JSON with a JSON array');
  }

  const contractName = validateContractName(process.env.CONTRACT ?? 'Hello');
  const constructorArgs = parseConstructorArgs(process.env.ARGS_JSON ?? '[]');

  console.log(
    `Deploying contract=${contractName} to network=${network.name} with ${constructorArgs.length} constructor argument(s)`
  );
  const factory = await ethers.getContractFactory(contractName);
  const contract = await factory.deploy(...constructorArgs);
  await contract.waitForDeployment();
  console.log('deployed:', await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
