# Scripts

## Installation

First, install dependencies:  

```sh
pnpm install
```

### Environment Variables  

Create a `.env` file in the root directory and define the following variables:  

```sh
SUPABASE_URL=https://your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_TABLENAME=your-table-name
```

#### Getting Supabase Credentials  

1. Go to your **Supabase dashboard**.  
2. Click on **Settings** in the sidebar.  
3. Navigate to **API**.  
4. Copy the **Project URL** and **Anon Public API Key** and paste them into your `.env` file.  

---

## Creating the Database  

1. Create a new project in Supabase (or use an existing one).  
2. Create a **new table** with the same name as defined in your `.env` file.  
3. Add the following columns:  

| Column Name | Type  | Notes  |
|------------|-------|--------|
| `address`  | `text`  | Stores wallet addresses |
| `balance`  | `int8`  | Stores token balances  |
| `proof`    | `text[]` | Stores Merkle proofs (must be an **array**) |

**Important:** Ensure that the `proof` column is defined as an **array type**.

---

## Generating the Merkle Tree  

Run the following command:  

```sh
node index.js
```

This will:  
- Load wallet addresses and balances from `addresses.json`.  
- Generate a **Merkle tree** and compute proofs.  
- Save the **Merkle root and proofs** to `merkleTree.json`.  
- (Optional) Upload the data to Supabase.  
