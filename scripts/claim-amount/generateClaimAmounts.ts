import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// For ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the scripts directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Constants
const DECIMALS = 18;
const ONE_TOKEN = BigInt(10) ** BigInt(DECIMALS); // 1e18
const CLAIM_POOL_AMOUNT = BigInt(100000) * ONE_TOKEN; // 100,000 UOS tokens with 18 decimals
const OUTPUT_FILE = path.join(__dirname, 'addresses.json');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
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

    console.log(`Total UOS balance across all users: ${totalBalance.toString()}`);

    // 3. Calculate each user's proportional claim amount
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

      // Calculate user's proportion of total and their claim amount
      const proportion = Number((userBalance * BigInt(1000000)) / totalBalance) / 1000000;
      let claimAmount = BigInt(Math.floor(proportion * Number(CLAIM_POOL_AMOUNT)));
      
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

    console.log(`Total calculated claim amount: ${totalClaimAmount} (${Number(totalClaimAmount) / Number(ONE_TOKEN)} UOS)`);
    
    // 4. Adjust for rounding errors to ensure exactly CLAIM_POOL_AMOUNT is distributed
    const adjustment = CLAIM_POOL_AMOUNT - totalClaimAmount;
    
    if (adjustment !== BigInt(0)) {
      console.log(`Adjustment needed: ${adjustment} (${Number(adjustment) / Number(ONE_TOKEN)} UOS)`);
      
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
    console.log(`Total Claim Pool: ${CLAIM_POOL_AMOUNT} UOS`);
    console.log(`Number of Recipients: ${claimValues.length}`);
    console.log(`Average Claim: ${avgClaim.toFixed(2)} UOS`);
    console.log(`Max Claim: ${maxClaim} UOS`);
    console.log(`Min Claim: ${minClaim} UOS`);
    
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