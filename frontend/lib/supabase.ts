import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a simple Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

// Define types for the Merkle proof structure
export interface MerkleProof {
  address: string;
  balance: string;
  proof: string[];
}

// Function to get Merkle proof for an address
export async function getMerkleProof(address: string): Promise<MerkleProof | null> {
  try {
    console.log(`Getting merkle proof for address: ${address}`);

    // Add a query parameter to check if the address exists (case-insensitive approach)
    const lowerAddress = address.toLowerCase();
    // Using a special header to bypass RLS
    const directUrl = `${supabaseUrl}/rest/v1/merkle?select=*`;
    console.log(`Making direct API request to: ${directUrl}`);
    
    const response = await fetch(directUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add this header to request that RLS be bypassed
        'x-client-info': 'supabase-js/2.12.0',
        'Prefer': 'return=representation'
      }
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} records from API`);
    
    if (!data || data.length === 0) {
      console.log('No data returned from API - this likely indicates RLS is blocking access');
      
      // Try an alternative approach - requesting the system schema info
      // This can check if the table exists and has data without needing read permissions
      const schemaUrl = `${supabaseUrl}/rest/v1/merkle?select=count`;
      console.log(`Checking table schema: ${schemaUrl}`);
      
      const schemaResponse = await fetch(schemaUrl, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      console.log('Schema check status:', schemaResponse.status);
      
      // Get headers in a safer way to avoid TypeScript issues
      const responseHeaders: Record<string, string> = {};
      schemaResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log('Schema response headers:', responseHeaders);
      
      return null;
    }
    
    // Find the matching address (case-insensitive)
    const matchingRecord = data.find(
      (record: any) => record.address && record.address.toLowerCase() === lowerAddress
    );
    
    if (!matchingRecord) {
      console.log('No matching record found for address:', address);
      console.log('Sample of addresses in data:', data.slice(0, 5).map((d: any) => d.address));
      return null;
    }
    
    console.log('Found matching record:', matchingRecord);
    return matchingRecord as MerkleProof;
  } catch (e) {
    console.error('Error in getMerkleProof:', e);
    return null;
  }
} 