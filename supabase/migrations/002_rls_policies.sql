-- Modulr Row Level Security Policies
-- Run this SQL in Supabase Dashboard → SQL Editor AFTER running 001_initial_schema.sql

-- ============================================
-- ENABLE RLS ON TRANSACTIONS TABLE
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);
