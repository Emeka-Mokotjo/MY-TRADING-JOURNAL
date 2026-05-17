-- Financial Transactions Schema
-- Centralized table for all financial activities across the platform

CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  source_table TEXT NOT NULL CHECK (source_table IN ('external_income', 'expenses', 'payouts', 'capital_accounts', 'account_purchases', 'allocation_transfers', 'withdrawals')),
  source_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Income', 'Expense', 'Transfer')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  linked_account_id UUID REFERENCES capital_accounts(id),
  linked_account_name TEXT,
  transaction_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_financial_transactions_source_lookup UNIQUE (user_id, source_table, source_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(user_id, type);

-- Enable Row Level Security
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view own financial transactions') THEN
    CREATE POLICY "Users can view own financial transactions" ON financial_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own financial transactions') THEN
    CREATE POLICY "Users can insert own financial transactions" ON financial_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own financial transactions') THEN
    CREATE POLICY "Users can update own financial transactions" ON financial_transactions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own financial transactions') THEN
    CREATE POLICY "Users can delete own financial transactions" ON financial_transactions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();