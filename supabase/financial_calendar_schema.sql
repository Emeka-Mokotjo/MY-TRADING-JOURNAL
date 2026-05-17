-- Financial Calendar Extension Schema
-- Tables for tracking withdrawals, account purchases, and allocation transfers

-- Withdrawals from capital accounts
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  account_id UUID REFERENCES capital_accounts(id) NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  withdrawal_reason TEXT,
  destination TEXT,
  notes TEXT,
  withdrawn_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funded Account Purchases (FTMO, TradingFuel, etc)
CREATE TABLE IF NOT EXISTS account_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  account_id UUID REFERENCES capital_accounts(id),
  provider TEXT NOT NULL CHECK (provider IN ('ftmo', 'tradingfuel', 'prop_firm', 'other')),
  account_size NUMERIC NOT NULL CHECK (account_size > 0),
  leverage NUMERIC,
  cost NUMERIC NOT NULL CHECK (cost > 0),
  purchase_reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'failed', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  purchased_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allocation Transfers (moving money between buckets: savings, emergency, investments)
CREATE TABLE IF NOT EXISTS allocation_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  from_category TEXT NOT NULL CHECK (from_category IN ('available', 'savings', 'emergency_fund', 'investments', 'trading', 'lifestyle')),
  to_category TEXT NOT NULL CHECK (to_category IN ('available', 'savings', 'emergency_fund', 'investments', 'trading', 'lifestyle')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  notes TEXT,
  transferred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_transfers ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies for withdrawals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view own withdrawals') THEN
    CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own withdrawals') THEN
    CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own withdrawals') THEN
    CREATE POLICY "Users can update own withdrawals" ON withdrawals FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own withdrawals') THEN
    CREATE POLICY "Users can delete own withdrawals" ON withdrawals FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- Row Level Security Policies for account_purchases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view own account purchases') THEN
    CREATE POLICY "Users can view own account purchases" ON account_purchases FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own account purchases') THEN
    CREATE POLICY "Users can insert own account purchases" ON account_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own account purchases') THEN
    CREATE POLICY "Users can update own account purchases" ON account_purchases FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own account purchases') THEN
    CREATE POLICY "Users can delete own account purchases" ON account_purchases FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- Row Level Security Policies for allocation_transfers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view own allocation transfers') THEN
    CREATE POLICY "Users can view own allocation transfers" ON allocation_transfers FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own allocation transfers') THEN
    CREATE POLICY "Users can insert own allocation transfers" ON allocation_transfers FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own allocation transfers') THEN
    CREATE POLICY "Users can update own allocation transfers" ON allocation_transfers FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own allocation transfers') THEN
    CREATE POLICY "Users can delete own allocation transfers" ON allocation_transfers FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$;
