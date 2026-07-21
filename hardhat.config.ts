import 'dotenv/config';
import { fileURLToPath } from 'node:url';

import hardhatEthers from '@nomicfoundation/hardhat-ethers';
import hardhatEthersChaiMatchers from '@nomicfoundation/hardhat-ethers-chai-matchers';
import hardhatMocha from '@nomicfoundation/hardhat-mocha';
import hardhatTypechain from '@nomicfoundation/hardhat-typechain';
import hardhatVerify from '@nomicfoundation/hardhat-verify';
import { configVariable, defineConfig } from 'hardhat/config';

const testnetAccounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

export default defineConfig({
  plugins: [
    hardhatEthers,
    hardhatEthersChaiMatchers,
    hardhatMocha,
    hardhatTypechain,
    hardhatVerify
  ],
  solidity: {
    version: '0.8.24',
    path: fileURLToPath(import.meta.resolve('solc/soljson.js')),
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    hardhatMainnet: { type: 'edr-simulated', chainType: 'l1' },
    localhost: { type: 'http', chainType: 'l1', url: 'http://127.0.0.1:8545' },
    sepolia: {
      type: 'http',
      chainType: 'l1',
      chainId: 11155111,
      url: configVariable('SEPOLIA_RPC_URL'),
      accounts: testnetAccounts
    },
    optimismSepolia: {
      type: 'http',
      chainType: 'op',
      chainId: 11155420,
      url: configVariable('OPTIMISM_SEPOLIA_RPC_URL'),
      accounts: testnetAccounts
    },
    // Production networks are read/verify-only. Keep signer material out of repository automation.
    mainnet: {
      type: 'http',
      chainType: 'l1',
      chainId: 1,
      url: configVariable('MAINNET_RPC_URL'),
      accounts: []
    },
    optimism: {
      type: 'http',
      chainType: 'op',
      chainId: 10,
      url: configVariable('OPTIMISM_RPC_URL'),
      accounts: []
    },
    polygonZk: {
      type: 'http',
      chainType: 'generic',
      chainId: 1101,
      url: configVariable('POLYGON_ZKEVM_RPC_URL'),
      accounts: []
    }
  },
  verify: {
    etherscan: {
      // Hardhat Verify 3 uses the Etherscan API V2 contract with one API key.
      apiKey: process.env.ETHERSCAN_API_KEY || ''
    }
  }
});
