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
    sepolia: { url: process.env.SEPOLIA_RPC_URL || '', accounts },
    mainnet: { url: process.env.MAINNET_RPC_URL || '', accounts },
    optimism: { url: process.env.OPTIMISM_RPC_URL || '', accounts },
    polygonZk: { url: process.env.POLYGON_ZKEVM_RPC_URL || '', accounts }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      optimism: process.env.OPTIMISTIC_ETHERSCAN_API_KEY || ''
    },
    // Optimism向けverify時のcustomChains例（APIエンドポイントは環境に合わせて更新すること）
    customChains: [
      {
        network: 'optimism',
        chainId: 10,
        urls: {
          apiURL: 'https://api-optimistic.etherscan.io/api',
          browserURL: 'https://optimistic.etherscan.io'
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
