-- Modulr Categories and Owners Tables
-- Run this SQL in Supabase Dashboard → SQL Editor AFTER running 002_rls_policies.sql

-- ============================================
-- CATEGORIES TABLE (System Default Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for category name and type
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_type ON categories(name, type);

-- ============================================
-- OWNERS TABLE (System Default Owners)
-- ============================================
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER_CATEGORIES TABLE (User Custom Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, type)
);

-- Indexes for user_categories
CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON user_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_categories_type ON user_categories(type);

-- ============================================
-- USER_OWNERS TABLE (User Custom Owners)
-- ============================================
CREATE TABLE IF NOT EXISTS user_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Index for user_owners
CREATE INDEX IF NOT EXISTS idx_user_owners_user_id ON user_owners(user_id);

-- ============================================
-- INSERT DEFAULT CATEGORIES
-- ============================================

-- Income categories
INSERT INTO categories (name, type) VALUES
  ('Salaire', 'income'),
  ('Remboursement', 'income'),
  ('Cadeau', 'income')
ON CONFLICT (name, type) DO NOTHING;

-- Expense categories
INSERT INTO categories (name, type) VALUES
  ('Assurances', 'expense'),
  ('Nourriture', 'expense'),
  ('Deplacement', 'expense'),
  ('Loisirs', 'expense'),
  ('Shopping', 'expense'),
  ('Abonnement', 'expense'),
  ('Santé', 'expense')
ON CONFLICT (name, type) DO NOTHING;

-- ============================================
-- INSERT DEFAULT OWNERS
-- ============================================
INSERT INTO owners (name) VALUES
  ('Moi')
ON CONFLICT (name) DO NOTHING;
