
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,  // Optimal settings found
        runs: 10000     // Best match was 10000 runs
      },
      evmVersion: "paris",  // Best match was paris
      viaIR: false,
      metadata: {
        bytecodeHash: "bzzr1"  // Try bzzr1 instead of default ipfs
      }
    }
  },
  sourcify: {
    enabled: true
  },
  networks: {
    // Base Sepolia Testnet
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },
    // Base Mainnet
    base: {
      url: process.env.BASE_MAINNET_RPC || "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    }
  },
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY,
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};