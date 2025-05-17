import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// For ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Constants
const DECIMALS = parseInt(process.env.TOKEN_DECIMALS || '18', 10);
const ONE_TOKEN = BigInt(10) ** BigInt(DECIMALS);

// Configure migration ratio (x:1 where x is the ratio)
// For example, 0.1:1 means for each 1 token on Solana, user gets 0.1 tokens on Base
const MIGRATION_RATIO = parseFloat(process.env.MIGRATION_RATIO || '0.1');
console.log(`Using migration ratio: ${MIGRATION_RATIO}:1`);

// If FIXED_RATIO is true, apply the exact ratio to each balance
// If false, use proportional distribution of CLAIM_POOL_AMOUNT
const FIXED_RATIO = process.env.FIXED_RATIO?.toLowerCase() === 'true' || false;
console.log(`Using fixed ratio: ${FIXED_RATIO ? 'Yes' : 'No, using proportional distribution'}`);

const CLAIM_POOL_AMOUNT = BigInt(process.env.CLAIM_POOL_AMOUNT || '100000') * ONE_TOKEN; // Default: 100,000 tokens
const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL || 'TOKEN';
const OUTPUT_FILE = path.join(__dirname, 'addresses.json');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

if (!process.env.CLAIM_POOL_AMOUNT) {
  console.warn('CLAIM_POOL_AMOUNT not set in .env file, using default of 100,000 tokens');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface UserBalance {
  evm_address: string;
  solana_balance: string; // Raw balance as string
}

/**
 * Main function to generate claim amounts
 */
async function generateClaimAmounts() {
  console.log('Starting claim amount calculation...');
  
  try {
    // 1. Fetch all registered users with their balances
    const { data: users, error: fetchError } = await supabase
      .from('registered_users')
      .select('evm_address, solana_balance')
      .not('solana_balance', 'is', null);

    if (fetchError) {
      throw new Error(`Error fetching users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No users with balances found');
      return;
    }

    console.log(`Found ${users.length} users with balances`);

    // 2. Calculate total balance across all users
    const totalBalance = users.reduce((sum, user) => {
      const balance = user.solana_balance ? BigInt(user.solana_balance) : BigInt(0);
      return sum + balance;
    }, BigInt(0));

    console.log(`Total ${TOKEN_SYMBOL} balance across all users: ${totalBalance.toString()}`);

    // 3. Calculate claim amounts for each user
    const claimAmounts: Record<string, bigint> = {};
    let totalClaimAmount = BigInt(0);

    users.forEach((user, index) => {
      if (!user.solana_balance || !user.evm_address) return;

      const userBalance = BigInt(user.solana_balance);
      
      // Skip users with zero balance
      if (userBalance === BigInt(0)) {
        console.log(`Skipping user with zero balance: ${user.evm_address}`);
        return;
      }

      let claimAmount: bigint;

      if (FIXED_RATIO) {
        // Calculate claim amount using fixed ratio
        // Convert ratio (which is a float) to BigInt calculation
        // For example 0.1 ratio for 100 tokens = 10 tokens
        const ratioBigInt = BigInt(Math.floor(MIGRATION_RATIO * 1000000));
        claimAmount = (userBalance * ratioBigInt) / BigInt(1000000);
      } else {
        // Calculate user's proportion of total and their claim amount from the pool
        const proportion = Number((userBalance * BigInt(1000000)) / totalBalance) / 1000000;
        claimAmount = BigInt(Math.floor(proportion * Number(CLAIM_POOL_AMOUNT)));
      }
      
      // Ensure minimum claim amount of 1 token if they have any balance
      if (userBalance > BigInt(0) && claimAmount === BigInt(0)) {
        claimAmount = ONE_TOKEN;
      }

      claimAmounts[user.evm_address] = claimAmount;
      totalClaimAmount += claimAmount;

      // Log progress every 100 users
      if ((index + 1) % 100 === 0 || index === users.length - 1) {
        console.log(`Processed ${index + 1}/${users.length} users`);
      }
    });

    console.log(`Total calculated claim amount: ${totalClaimAmount} (${Number(totalClaimAmount) / Number(ONE_TOKEN)} ${TOKEN_SYMBOL})`);
    
    // 4. If using proportional distribution, adjust for rounding errors to ensure exact CLAIM_POOL_AMOUNT
    if (!FIXED_RATIO) {
      const adjustment = CLAIM_POOL_AMOUNT - totalClaimAmount;
      
      if (adjustment !== BigInt(0)) {
        console.log(`Adjustment needed: ${adjustment} (${Number(adjustment) / Number(ONE_TOKEN)} ${TOKEN_SYMBOL})`);
        
        // Find the user with the largest balance to apply the adjustment
        let maxBalanceUser = '';
        let maxBalance = BigInt(0);
        
        for (const user of users) {
          if (!user.solana_balance || !user.evm_address) continue;
          
          const balance = BigInt(user.solana_balance);
          if (balance > maxBalance) {
            maxBalance = balance;
            maxBalanceUser = user.evm_address;
          }
        }
        
        if (maxBalanceUser) {
          claimAmounts[maxBalanceUser] += adjustment;
          console.log(`Applied adjustment to user with largest balance: ${maxBalanceUser}`);
        }
      }
    } else {
      console.log(`Using fixed ratio mode. Total claim amount may differ from CLAIM_POOL_AMOUNT.`);
    }

    // 5. Output the result to a JSON file
    const outputData = Object.fromEntries(
      Object.entries(claimAmounts).map(([address, amount]) => [address, amount.toString()])
    );
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 4));
    console.log(`Claim amounts written to ${OUTPUT_FILE}`);
    
    // 6. Print statistics
    const claimValues = Object.values(claimAmounts);
    const totalClaim = claimValues.reduce((a, b) => a + b, BigInt(0));
    const avgClaim = Number(totalClaim) / Number(ONE_TOKEN) / claimValues.length;
    const maxClaim = Number(claimValues.reduce((a, b) => a > b ? a : b, BigInt(0))) / Number(ONE_TOKEN);
    const minClaim = Number(claimValues.reduce((a, b) => a < b ? a : b, CLAIM_POOL_AMOUNT)) / Number(ONE_TOKEN);
    
    console.log('\nClaim Amount Statistics:');
    console.log(`Total Claim Amount: ${Number(totalClaim) / Number(ONE_TOKEN)} ${TOKEN_SYMBOL}`);
    console.log(`Number of Recipients: ${claimValues.length}`);
    console.log(`Average Claim: ${avgClaim.toFixed(2)} ${TOKEN_SYMBOL}`);
    console.log(`Max Claim: ${maxClaim} ${TOKEN_SYMBOL}`);
    console.log(`Min Claim: ${minClaim} ${TOKEN_SYMBOL}`);
    
  } catch (error) {
    console.error('Error generating claim amounts:', error);
    process.exit(1);
  }
}

// Run the script
generateClaimAmounts()
  .then(() => {
    console.log('Claim amount generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 