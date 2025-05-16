#!/usr/bin/env node

/**
 * Token Migration Workflow Helper
 * 
 * This script guides users through the token migration process:
 * 1. Taking a snapshot of Solana token holders
 * 2. Calculating claim amounts for Base
 * 3. Generating a Merkle tree for token claims
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const dotenv = require('dotenv');

// Load environment variables
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths to the different script directories
const SNAPSHOT_DIR = path.join(__dirname, 'snapshot');
const CLAIM_AMOUNT_DIR = path.join(__dirname, 'claim-amount');
const MERKLE_DIR = path.join(__dirname, 'merkle');

// Files that will be generated and shared between steps
const SNAPSHOT_RESULTS = 'snapshot_results.json';
const ADDRESSES_JSON = 'addresses.json';
const MERKLE_TREE_JSON = 'merkleTree.json';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Check if the .env file is configured properly
 */
function checkEnvConfig() {
  console.log(`${colors.cyan}Checking .env configuration...${colors.reset}`);
  
  if (!fs.existsSync(ENV_FILE)) {
    console.log(`${colors.red}Error: .env file not found.${colors.reset}`);
    console.log(`Please create a .env file in the scripts directory with the required configuration.`);
    console.log(`See .env.example for the required fields.`);
    return false;
  }
  
  const envVars = [
    { name: 'SUPABASE_URL', step: 'all steps (database storage)' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', step: 'all steps (database storage)' },
    { name: 'EXTRNODE_RPC_URL', step: 'snapshot' },
    { name: 'TOKEN_MINT_ADDRESS', step: 'snapshot', required: true },
    { name: 'TOKEN_DECIMALS', step: 'claim amount calculation', defaultValue: '18' },
    { name: 'TOKEN_SYMBOL', step: 'claim amount calculation', defaultValue: 'TOKEN' },
    { name: 'CLAIM_POOL_AMOUNT', step: 'claim amount calculation', defaultValue: '100000' }
  ];
  
  let allValid = true;
  const missingRequired = [];
  
  envVars.forEach(v => {
    const value = process.env[v.name];
    if (!value && v.required) {
      allValid = false;
      missingRequired.push(v);
    } else if (!value && !v.defaultValue) {
      console.log(`${colors.yellow}Warning: ${v.name} is not set. This is needed for ${v.step}.${colors.reset}`);
    } else if (!value && v.defaultValue) {
      console.log(`${colors.yellow}Note: ${v.name} is not set, using default value (${v.defaultValue}) for ${v.step}.${colors.reset}`);
    }
  });
  
  if (missingRequired.length > 0) {
    console.log(`${colors.red}Error: The following required environment variables are missing:${colors.reset}`);
    missingRequired.forEach(v => {
      console.log(`  - ${v.name} (required for ${v.step})`);
    });
    return false;
  }
  
  if (allValid) {
    console.log(`${colors.green}Environment configuration looks good!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Environment configuration has warnings, but can proceed.${colors.reset}`);
  }
  
  return true;
}

/**
 * Execute a command in a specific directory
 */
function executeCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.bright}${colors.blue}> ${command} ${args.join(' ')}${colors.reset}`);
    
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    process.on('error', reject);
  });
}

/**
 * Ask a yes/no question
 */
function askYesNo(question) {
  return new Promise(resolve => {
    rl.question(`${question} (y/n) `, answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Step 1: Run the Solana snapshot
 */
async function runSnapshot() {
  console.log(`\n${colors.bright}${colors.green}=== STEP 1: Take Snapshot of Solana Token Holders ===${colors.reset}\n`);
  
  try {
    // Install dependencies first
    await executeCommand('npm', ['install'], SNAPSHOT_DIR);
    
    // Run the snapshot script
    console.log(`\n${colors.cyan}Running Solana token snapshot for ${process.env.TOKEN_MINT_ADDRESS}...${colors.reset}`);
    await executeCommand('npm', ['run', 'snapshot'], SNAPSHOT_DIR);
    
    console.log(`\n${colors.green}Snapshot step completed!${colors.reset}`);
    
    // Check if Supabase is being used
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log(`${colors.cyan}Snapshot results stored in Supabase.${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
    return false;
  }
}

/**
 * Step 2: Calculate claim amounts for Base
 */
async function calculateClaimAmounts() {
  console.log(`\n${colors.bright}${colors.green}=== STEP 2: Calculate Claim Amounts for Base ===${colors.reset}\n`);
  
  try {
    // Install dependencies
    await executeCommand('npm', ['install'], CLAIM_AMOUNT_DIR);
    
    // Run the claim amount script
    console.log(`\n${colors.cyan}Calculating claim amounts...${colors.reset}`);
    await executeCommand('npm', ['run', 'generate'], CLAIM_AMOUNT_DIR);
    
    // Check if the addresses file exists
    const addressesPath = path.join(CLAIM_AMOUNT_DIR, ADDRESSES_JSON);
    if (!fs.existsSync(addressesPath)) {
      throw new Error(`Addresses file not found: ${ADDRESSES_JSON}`);
    }
    
    console.log(`\n${colors.green}Claim amounts calculated!${colors.reset} Results saved to: ${addressesPath}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
    return false;
  }
}

/**
 * Step 3: Generate Merkle tree for claims
 */
async function generateMerkleTree() {
  console.log(`\n${colors.bright}${colors.green}=== STEP 3: Generate Merkle Tree for Claims ===${colors.reset}\n`);
  
  try {
    // Copy the addresses.json from claim-amount directory
    const sourcePath = path.join(CLAIM_AMOUNT_DIR, ADDRESSES_JSON);
    const destPath = path.join(MERKLE_DIR, ADDRESSES_JSON);
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Addresses file not found: ${ADDRESSES_JSON}`);
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${ADDRESSES_JSON} to merkle directory.`);
    
    // Install dependencies
    await executeCommand('npm', ['install'], MERKLE_DIR);
    
    // Run the Merkle tree generator
    console.log(`\n${colors.cyan}Generating Merkle tree...${colors.reset}`);
    await executeCommand('npm', ['run', 'generate'], MERKLE_DIR);
    
    // Check if the Merkle tree file exists
    const merkleTreePath = path.join(MERKLE_DIR, MERKLE_TREE_JSON);
    if (!fs.existsSync(merkleTreePath)) {
      throw new Error(`Merkle tree file not found: ${MERKLE_TREE_JSON}`);
    }
    
    // Read the Merkle root for display
    const merkleTreeData = JSON.parse(fs.readFileSync(merkleTreePath, 'utf8'));
    const merkleRoot = merkleTreeData.root;
    
    console.log(`\n${colors.green}Merkle tree generated!${colors.reset} Results saved to: ${merkleTreePath}`);
    console.log(`\n${colors.bright}${colors.magenta}Merkle Root:${colors.reset} ${merkleRoot}`);
    console.log(`\n${colors.yellow}IMPORTANT:${colors.reset} You will need to deploy your contract with this Merkle root.`);
    
    // Check if Supabase is configured
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log(`${colors.cyan}Merkle proofs have also been uploaded to Supabase.${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
    return false;
  }
}

/**
 * Main function to run the migration workflow
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}=====================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  Solana to Base Token Migration${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}=====================================${colors.reset}`);
  
  // Check environment configuration first
  const configValid = checkEnvConfig();
  if (!configValid) {
    const proceed = await askYesNo('Would you like to proceed anyway?');
    if (!proceed) {
      rl.close();
      return;
    }
  }
  
  const runAll = await askYesNo('Would you like to run the complete migration workflow?');
  
  if (runAll) {
    const snapshotSuccess = await runSnapshot();
    if (!snapshotSuccess) {
      console.log(`${colors.red}Snapshot step failed. Please fix the issues and try again.${colors.reset}`);
      rl.close();
      return;
    }
    
    const claimAmountsSuccess = await calculateClaimAmounts();
    if (!claimAmountsSuccess) {
      console.log(`${colors.red}Claim amount calculation failed. Please fix the issues and try again.${colors.reset}`);
      rl.close();
      return;
    }
    
    const merkleTreeSuccess = await generateMerkleTree();
    if (!merkleTreeSuccess) {
      console.log(`${colors.red}Merkle tree generation failed. Please fix the issues and try again.${colors.reset}`);
      rl.close();
      return;
    }
    
    console.log(`\n${colors.bright}${colors.green}Migration workflow completed successfully!${colors.reset}`);
    console.log(`\n${colors.cyan}Next Steps:${colors.reset}`);
    console.log(`1. Deploy your token contract with the Merkle root from merkleTree.json`);
    console.log(`2. Update your frontend with the contract address`);
  } else {
    let option = '';
    
    do {
      console.log('\nSelect a step to run:');
      console.log('1) Take Snapshot of Solana Token Holders');
      console.log('2) Calculate Claim Amounts for Base');
      console.log('3) Generate Merkle Tree for Claims');
      console.log('q) Quit');
      
      option = await new Promise(resolve => {
        rl.question('Enter option: ', resolve);
      });
      
      switch (option) {
        case '1':
          await runSnapshot();
          break;
        case '2':
          await calculateClaimAmounts();
          break;
        case '3':
          await generateMerkleTree();
          break;
        case 'q':
          console.log('Exiting...');
          break;
        default:
          console.log(`${colors.red}Invalid option.${colors.reset}`);
      }
    } while (option !== 'q');
  }
  
  rl.close();
}

main().catch(console.error); 