-- Modulr Categories and Owners RLS Policies
-- Run this SQL in Supabase Dashboard → SQL Editor AFTER running 003_categories_owners.sql

-- ============================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_owners ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES POLICIES (Read-only for all authenticated users)
-- ============================================

-- All authenticated users can view default categories
CREATE POLICY "Authenticated users can view categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- OWNERS POLICIES (Read-only for all authenticated users)
-- ============================================

-- All authenticated users can view default owners
CREATE POLICY "Authenticated users can view owners"
  ON owners
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- USER_CATEGORIES POLICIES (Full CRUD for own records)
-- ============================================

-- Users can view their own custom categories
CREATE POLICY "Users can view own custom categories"
  ON user_categories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own custom categories
CREATE POLICY "Users can insert own custom categories"
  ON user_categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own custom categories
CREATE POLICY "Users can update own custom categories"
  ON user_categories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own custom categories
CREATE POLICY "Users can delete own custom categories"
  ON user_categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- USER_OWNERS POLICIES (Full CRUD for own records)
-- ============================================

-- Users can view their own custom owners
CREATE POLICY "Users can view own custom owners"
  ON user_owners
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own custom owners
CREATE POLICY "Users can insert own custom owners"
  ON user_owners
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own custom owners
CREATE POLICY "Users can update own custom owners"
  ON user_owners
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own custom owners
CREATE POLICY "Users can delete own custom owners"
  ON user_owners
  FOR DELETE
  USING (auth.uid() = user_id);
