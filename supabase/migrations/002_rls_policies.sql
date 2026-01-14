-- Modulr Row Level Security Policies
-- Run this SQL in Supabase Dashboard → SQL Editor AFTER running 001_initial_schema.sql

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktails ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- RECIPES POLICIES
-- ============================================

-- Users can view their own recipes
CREATE POLICY "Users can view own recipes"
  ON recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recipes
CREATE POLICY "Users can insert own recipes"
  ON recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recipes
CREATE POLICY "Users can update own recipes"
  ON recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recipes
CREATE POLICY "Users can delete own recipes"
  ON recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COCKTAILS POLICIES
-- ============================================

-- Users can view their own cocktails
CREATE POLICY "Users can view own cocktails"
  ON cocktails
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own cocktails
CREATE POLICY "Users can insert own cocktails"
  ON cocktails
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cocktails
CREATE POLICY "Users can update own cocktails"
  ON cocktails
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cocktails
CREATE POLICY "Users can delete own cocktails"
  ON cocktails
  FOR DELETE
  USING (auth.uid() = user_id);
