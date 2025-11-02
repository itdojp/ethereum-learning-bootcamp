import * as dotenv from 'dotenv';
dotenv.config();
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'solidity-coverage';
import 'hardhat-gas-reporter';

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    sepolia: { url: process.env.SEPOLIA_RPC_URL || '', accounts },
    mainnet: { url: process.env.MAINNET_RPC_URL || '', accounts },
    optimism: { url: process.env.OPTIMISM_RPC_URL || '', accounts },
    polygonZk: { url: process.env.POLYGON_ZKEVM_RPC_URL || '', accounts }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ''
  },
  gasReporter: {
    enabled: true,
    currency: 'USD'
  }
};

export default config;
