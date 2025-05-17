const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const tree = require("./generateMerkletree");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLENAME = process.env.SUPABASE_TABLENAME;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to send batch data to Supabase
async function sendDataBatch(entries) {
  const formattedData = Object.entries(entries).map(([account, { balance, proof }]) => ({
    address: account,
    balance: balance.toString(), // Convert to string since the column is text
    proof,
  }));

  const { data, error } = await supabase.from('merkle').insert(formattedData);

  if (error) {
    console.error("Error inserting data:", error);
  } else {
    console.log("Data successfully inserted:", data);
  }
}

async function main() {
    // Load addresses from JSON file using absolute path
    const addressesPath = path.join(__dirname, "addresses.json");
    console.log("Reading addresses from:", addressesPath);
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    console.log("Loaded Addresses:", addresses);
  
    // Generate Merkle tree and proofs
    const merkletree = tree.generateMerkleTree(addresses);
    const proofs = tree.generateProofs(merkletree, addresses);
  
    // Prepare entries
    const entries = Object.fromEntries(
      Object.entries(addresses).map(([account, balance]) => [
        account,
        { balance, proof: proofs[account] },
      ])
    );
  
    // Save Merkle tree root and proofs to JSON
    const merkleData = {
      root: merkletree.getHexRoot(),
      proofs: entries,
    };
  
    fs.writeFileSync("merkleTree.json", JSON.stringify(merkleData, null, 2), "utf8");
  
    console.log("Merkle tree saved to merkleTree.json");
  
    // Log the entries
    console.log("Generated Entries:", entries);
  
    // Send batch data to Supabase
    await sendDataBatch(entries);
  
    console.log("Process complete.");
  }
  

main().catch(console.error);