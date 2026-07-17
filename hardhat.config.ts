import * as dotenv from 'dotenv';
dotenv.config();
import { HardhatUserConfig, subtask } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'solidity-coverage';
import 'hardhat-gas-reporter';
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from 'hardhat/builtin-tasks/task-names';
import type { SolcBuild } from 'hardhat/types';

subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(
  async ({ solcVersion }: { solcVersion: string }): Promise<SolcBuild> => {
    const solc = require('solc');
    const longVersion = solc.version();
    if (!longVersion.startsWith(solcVersion)) {
      throw new Error(
        `Local solc version mismatch: ${longVersion} (expected ${solcVersion})`
      );
    }

    return {
      version: solcVersion,
      longVersion,
      compilerPath: require.resolve('solc/soljson.js'),
      isSolcJs: true
    };
  }
);

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    localhost: { url: 'http://127.0.0.1:8545' },
    sepolia: { chainId: 11155111, url: process.env.SEPOLIA_RPC_URL || '', accounts },
    optimismSepolia: {
      chainId: 11155420,
      url: process.env.OPTIMISM_SEPOLIA_RPC_URL || '',
      accounts
    },
    mainnet: { chainId: 1, url: process.env.MAINNET_RPC_URL || '', accounts },
    optimism: { chainId: 10, url: process.env.OPTIMISM_RPC_URL || '', accounts },
    polygonZk: { url: process.env.POLYGON_ZKEVM_RPC_URL || '', accounts }
  },
  etherscan: {
    // hardhat-verify 2.1.3 selects Etherscan API V2 when apiKey is one string.
    apiKey: process.env.ETHERSCAN_API_KEY || '',
    // Hardhat 2's verify plugin does not yet include OP Sepolia as a built-in chain.
    // With a string API key, the plugin sends chainid=11155420 to this V2 endpoint.
    customChains: [
      {
        network: 'optimismSepolia',
        chainId: 11155420,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api',
          browserURL: 'https://sepolia-optimism.etherscan.io'
        }
      }
    ]
  },
  gasReporter: {
    enabled: true,
    currency: 'USD'
  }
};

export default config;
