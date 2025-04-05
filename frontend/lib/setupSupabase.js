// This script can be run to set up the Supabase tables
// Run with: node lib/setupSupabase.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('Setting up Supabase tables...');

  try {
    // Create registered_users table
    const { error: createError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'registered_users',
      columns: `
        id SERIAL PRIMARY KEY,
        solana_address TEXT NOT NULL UNIQUE,
        evm_address TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });

    if (createError) {
      console.error('Error creating registered_users table:', createError);
      
      // Try direct SQL if RPC fails
      console.log('Trying direct SQL...');
      const { error: sqlError } = await supabase.from('registered_users').select('count(*)');
      
      if (sqlError && sqlError.code === '42P01') {
        console.log('Table does not exist. Creating it with SQL API...');
        
        // Create the table using SQL
        const { error: createTableError } = await supabase.sql(`
          CREATE TABLE IF NOT EXISTS registered_users (
            id SERIAL PRIMARY KEY,
            solana_address TEXT NOT NULL UNIQUE,
            evm_address TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        
        if (createTableError) {
          console.error('Error creating table with SQL:', createTableError);
          return;
        }
      } else if (sqlError) {
        console.error('Error checking table existence:', sqlError);
        return;
      } else {
        console.log('Table already exists!');
      }
    }

    // Create merkle table
    const { error: createMerkleError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'merkle',
      columns: `
        address TEXT PRIMARY KEY,
        balance TEXT NOT NULL,
        proof TEXT[] NOT NULL
      `
    });

    if (createMerkleError) {
      console.error('Error creating merkle table:', createMerkleError);
      
      // Try direct SQL if RPC fails
      console.log('Trying direct SQL for merkle table...');
      const { error: sqlError } = await supabase.from('merkle').select('count(*)');
      
      if (sqlError && sqlError.code === '42P01') {
        console.log('Merkle table does not exist. Creating it with SQL API...');
        
        // Create the table using SQL
        const { error: createTableError } = await supabase.sql(`
          CREATE TABLE IF NOT EXISTS merkle (
            address TEXT PRIMARY KEY,
            balance TEXT NOT NULL,
            proof TEXT[] NOT NULL
          );
        `);
        
        if (createTableError) {
          console.error('Error creating merkle table with SQL:', createTableError);
          return;
        }
      } else if (sqlError) {
        console.error('Error checking merkle table existence:', sqlError);
        return;
      } else {
        console.log('Merkle table already exists!');
      }
    }

    console.log('Tables set up successfully!');
    
    // Test inserting a record
    console.log('Testing table with a sample record...');
    const { data, error } = await supabase
      .from('registered_users')
      .insert({
        solana_address: 'test_solana_address',
        evm_address: 'test_evm_address'
      })
      .select();
      
    if (error) {
      console.error('Error inserting test record:', error);
    } else {
      console.log('Test record inserted successfully:', data);
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('registered_users')
        .delete()
        .eq('solana_address', 'test_solana_address');
        
      if (deleteError) {
        console.error('Error deleting test record:', deleteError);
      } else {
        console.log('Test record deleted successfully');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupTables()
  .then(() => console.log('Setup complete'))
  .catch(err => console.error('Setup failed:', err)); 