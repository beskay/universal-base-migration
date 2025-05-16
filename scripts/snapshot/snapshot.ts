import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the scripts directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Constants
const UOS_TOKEN_MINT = '79HZeHkX9A5WfBg72ankd1ppTXGepoSGpmkxW63wsrHY';
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// RPC endpoints for reliability
const RPC_ENDPOINTS = [
  process.env.EXTRNODE_RPC_URL,
  'https://rpc.ankr.com/solana',
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com'
].filter(Boolean) as string[];

interface User {
  solana_address: string;
  evm_address: string;
}

interface TokenBalance {
  amount: string;  // Raw amount as string
  decimals: number;  // Number of decimals
}

interface SnapshotResult {
  successful: Array<{ solana_address: string; balance: TokenBalance }>;
  failed: Array<User>;
}

async function getUosBalance(walletAddress: string, connection: Connection): Promise<TokenBalance> {
  try {
    const wallet = new PublicKey(walletAddress);
    
    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
      programId: new PublicKey(TOKEN_PROGRAM_ID),
    });

    // Find UOS token account
    const uosAccount = tokenAccounts.value.find(
      (account) => account.account.data.parsed.info.mint === UOS_TOKEN_MINT
    );

    if (!uosAccount) {
      return { amount: "0", decimals: 9 };  // UOS has 9 decimals
    }

    const tokenAmount = uosAccount.account.data.parsed.info.tokenAmount;
    return {
      amount: tokenAmount.amount,
      decimals: tokenAmount.decimals
    };
  } catch (error) {
    console.error(`Error getting balance for ${walletAddress}:`, error);
    throw error;
  }
}

async function processUserBatch(batch: User[]): Promise<SnapshotResult> {
  const result: SnapshotResult = {
    successful: [],
    failed: []
  };

  await Promise.all(batch.map(async (user) => {
    let balance: TokenBalance | null = null;

    // Try each RPC endpoint until successful
    for (const endpoint of RPC_ENDPOINTS) {
      if (balance !== null) break;

      try {
        const connection = new Connection(endpoint);
        balance = await getUosBalance(user.solana_address, connection);
        break;
      } catch (error) {
        console.warn(`Failed to get balance from ${endpoint} for ${user.solana_address}`);
        continue;
      }
    }

    if (balance === null) {
      console.error(`Failed to get balance for ${user.solana_address} from all endpoints`);
      result.failed.push(user);
      return;
    }

    try {
      // Store the raw amount directly in solana_balance column
      const { error: updateError } = await supabase
        .from('registered_users')
        .update({ solana_balance: balance.amount }) // Store raw amount as numeric
        .eq('solana_address', user.solana_address);

      if (updateError) {
        console.error(`Failed to update balance for ${user.solana_address}:`, updateError);
        result.failed.push(user);
      } else {
        result.successful.push({
          solana_address: user.solana_address,
          balance
        });
      }
    } catch (error) {
      console.error(`Error updating balance for ${user.solana_address}:`, error);
      result.failed.push(user);
    }
  }));

  return result;
}

async function takeSnapshot() {
  console.log('Starting UOS balance snapshot...');
  const startTime = Date.now();
  
  try {
    // 1. Get all registered users
    const { data: users, error: fetchError } = await supabase
      .from('registered_users')
      .select('solana_address, evm_address');

    if (fetchError) {
      throw new Error(`Error fetching users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No registered users found');
      return;
    }

    console.log(`Found ${users.length} registered users`);

    // Process users in batches of 5 (reduced from 10)
    const batchSize = 5;
    let totalSuccessful: Array<{ solana_address: string; balance: TokenBalance }> = [];
    let totalFailed: Array<User> = [];

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);
      
      const batchResult = await processUserBatch(batch);
      totalSuccessful = [...totalSuccessful, ...batchResult.successful];
      totalFailed = [...totalFailed, ...batchResult.failed];

      // Add a larger delay between batches to avoid rate limiting
      console.log("Waiting 3 seconds before processing next batch...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Print summary
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    console.log('\n=== Snapshot Complete ===');
    console.log(`Duration: ${duration.toFixed(2)} seconds`);
    console.log(`Successfully processed: ${totalSuccessful.length} addresses`);
    console.log(`Failed to process: ${totalFailed.length} addresses`);

    if (totalFailed.length > 0) {
      console.log('\nFailed addresses:');
      totalFailed.forEach((f) => console.log(`- ${f.solana_address}`));
    }

    // Print some balance statistics
    if (totalSuccessful.length > 0) {
      const balances = totalSuccessful.map(s => {
        const amount = BigInt(s.balance.amount);
        const decimals = s.balance.decimals;
        return Number(amount) / Math.pow(10, decimals);
      });
      
      const totalBalance = balances.reduce((a, b) => a + b, 0);
      const avgBalance = totalBalance / balances.length;
      const maxBalance = Math.max(...balances);
      const minBalance = Math.min(...balances);

      console.log('\nBalance Statistics (in UOS units):');
      console.log(`Total UOS: ${totalBalance.toFixed(9)}`);
      console.log(`Average UOS: ${avgBalance.toFixed(9)}`);
      console.log(`Max UOS: ${maxBalance.toFixed(9)}`);
      console.log(`Min UOS: ${minBalance.toFixed(9)}`);
    }

  } catch (error) {
    console.error('Error taking snapshot:', error);
    process.exit(1);
  }
}

// Run the snapshot
takeSnapshot()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 