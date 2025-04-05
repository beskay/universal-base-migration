-- Table for storing registered users
CREATE TABLE registered_users (
  id SERIAL PRIMARY KEY,
  solana_address TEXT NOT NULL UNIQUE,
  evm_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing snapshot data (to be populated by admin)
CREATE TABLE snapshot_data (
  id SERIAL PRIMARY KEY,
  solana_address TEXT NOT NULL REFERENCES registered_users(solana_address),
  evm_address TEXT NOT NULL,
  uos_balance TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing merkle tree data (to be populated by admin)
CREATE TABLE merkle (
  address TEXT PRIMARY KEY,
  balance TEXT NOT NULL,
  proof TEXT[] NOT NULL
);

-- Index for faster lookups
CREATE INDEX idx_registered_users_solana_address ON registered_users(solana_address);
CREATE INDEX idx_registered_users_evm_address ON registered_users(evm_address);
CREATE INDEX idx_snapshot_data_solana_address ON snapshot_data(solana_address);
CREATE INDEX idx_merkle_address ON merkle(address); 