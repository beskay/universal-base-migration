require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-foundry");

require('dotenv').config();
const { RPC_BASE, PK_BASE } = process.env;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    base: {
      url: RPC_BASE,
      accounts: [`0x${PK_BASE}`],
    },
  },
};