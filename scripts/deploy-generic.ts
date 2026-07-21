import { network } from 'hardhat';
import { createRequire } from 'node:module';

const connection = await network.create();
const { ethers } = connection;

const require = createRequire(import.meta.url);
const { parseConstructorArgs, validateContractName } = require('../tools/deploy-inputs.cjs') as {
  parseConstructorArgs: (value: string) => unknown[];
  validateContractName: (value: string) => string;
};

async function main() {
  if (process.env.ARGS !== undefined) {
    throw new Error('ARGS is no longer accepted; use ARGS_JSON with a JSON array');
  }

  const contractName = validateContractName(process.env.CONTRACT ?? 'Hello');
  const constructorArgs = parseConstructorArgs(process.env.ARGS_JSON ?? '[]');

  console.log(
    `Deploying contract=${contractName} to network=${connection.networkName} with ${constructorArgs.length} constructor argument(s)`
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
