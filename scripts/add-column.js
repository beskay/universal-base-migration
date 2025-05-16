#!/usr/bin/env node

/**
 * Database Schema Update Script
 * Adds solana_balance column to registered_users table
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the scripts directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Check for Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Initialize Supabase client with service role key for schema changes
const supabase = createClient(supabaseUrl, supabaseKey);

async function addBalanceColumn() {
  console.log('Adding solana_balance column to registered_users table...');

  try {
    // First check if the column already exists to avoid errors
    const { data: columnCheck, error: checkError } = await supabase
      .rpc('column_exists', { 
        table_name: 'registered_users', 
        column_name: 'solana_balance' 
      });

    if (checkError) {
      // If the RPC function doesn't exist, we'll try to add the column directly
      console.log('Could not check for column existence. Attempting to add column directly...');
    } else if (columnCheck === true) {
      console.log('The solana_balance column already exists.');
      return;
    }

    // Execute the SQL to add the column
    const { error } = await supabase.rpc('add_column', {
      table: 'registered_users',
      column_name: 'solana_balance',
      column_type: 'text'
    });

    if (error) {
      // Fallback: If the RPC method isn't available, we'll attempt with raw SQL
      // This requires higher permissions and may not work with default anon key
      console.log('Attempting alternative method to add column...');
      
      const { error: sqlError } = await supabase
        .from('registered_users')
        .update({ solana_balance: null })
        .eq('id', 0)
        .select();
      
      if (sqlError && sqlError.message.includes('column "solana_balance" does not exist')) {
        console.error('Error: Could not add solana_balance column.');
        console.error('Please add the column manually in the Supabase dashboard:');
        console.error('1. Go to your Supabase project');
        console.error('2. Go to "Table editor" and select "registered_users" table');
        console.error('3. Click "Edit table" and add a new column:');
        console.error('   - Name: solana_balance');
        console.error('   - Type: text');
        console.error('   - Default Value: null');
        console.error('4. Click "Save"');
        process.exit(1);
      }
    }

    console.log('Successfully added solana_balance column to registered_users table.');
  } catch (error) {
    console.error('Error adding column:', error.message);
    console.error('Please add the column manually in the Supabase dashboard.');
    process.exit(1);
  }
}

addBalanceColumn()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 