-- External Income Tracking Schema Extension
-- Run this separately to add external income functionality to your existing money management system

CREATE TABLE IF NOT EXISTS external_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  description TEXT,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE external_income ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view own external income') THEN
    CREATE POLICY "Users can view own external income" ON external_income FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own external income') THEN
    CREATE POLICY "Users can insert own external income" ON external_income FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own external income') THEN
    CREATE POLICY "Users can update own external income" ON external_income FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own external income') THEN
    CREATE POLICY "Users can delete own external income" ON external_income FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$;