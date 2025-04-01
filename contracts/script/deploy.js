const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy UOS contract
    const UOS = await ethers.getContractFactory("UOS");
    const uOS = await UOS.deploy();
    await uOS.waitForDeployment(); 
    console.log("UOS deployed to:", await uOS.getAddress()); 

    // Transfer UOS tokens for claims to the contract
    // const amount = ethers.parseEther("100000"); // 10% of total supply - 100k uOS
    // const tx = await uOS.transfer(await uOS.getAddress(), amount);
    // await tx.wait();
    // console.log(`Transferred ${amount} UOS tokens to contract`);
    
    // Placeholder for setting Merkle root
    // await uOS.setMerkleRoot("0xa99796701bf15c5d4e0b9d081e93b9bd5d1c03c27e314a7ffd836296872bbfd7");

    // Placeholder for setting up multisig
    // await uOS.transferOwnership(multiSigAddress);
    
    
    // Placeholder for deploying StakingRewards later
    // const StakingRewards = await ethers.getContractFactory("StakingRewards");
    // const stakingRewards = await StakingRewards.deploy(uOS.address, stakingTokenAddress);
    // await stakingRewards.deployed();
    // console.log("StakingRewards deployed to:", stakingRewards.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });