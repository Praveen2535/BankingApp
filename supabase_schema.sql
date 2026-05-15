
-- INDUS BANKING - SUPABASE SCHEMA
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create Profiles Table (Stores User Data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  bio TEXT,
  account_number TEXT UNIQUE NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0,
  pin TEXT DEFAULT '0000',
  is_registered BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(15, 2) NOT NULL,
  recipient TEXT NOT NULL,
  account_number TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'processing', 'failed', 'flagged')),
  category TEXT DEFAULT 'Transfer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('security', 'info', 'alert')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sample Data (Optional)
-- INSERT INTO profiles (name, email, bio, account_number, balance, role)
-- VALUES ('Prakash', 'prakash@example.com', 'Fintech enthusiast', '9876543210', 125000, 'admin');

-- 5. Enable Realtime (Optional - specifically for the transactions and notifications)
-- alter publication supabase_realtime add table transactions;
-- alter publication supabase_realtime add table notifications;
