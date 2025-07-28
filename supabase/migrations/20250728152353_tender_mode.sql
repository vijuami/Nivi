/*
  # Complete User Authentication and Finance System

  1. New Tables
    - Ensures all user tables exist with proper relationships
    - Updates RLS policies for secure data access
    - Adds proper indexes for performance

  2. Security
    - Enable RLS on all user tables
    - Add policies for authenticated users to access only their own data
    - Ensure proper foreign key relationships

  3. Functions
    - Add helper function for getting current user ID
    - Add trigger function for updating timestamps
*/

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION uid() RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (uid() = id)
  WITH CHECK (uid() = id);

CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (uid() = id);

-- Create user_finance_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_finance_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  finance_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_finance_data
ALTER TABLE user_finance_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_finance_data
DROP POLICY IF EXISTS "Users can insert own finance data" ON user_finance_data;
DROP POLICY IF EXISTS "Users can update own finance data" ON user_finance_data;
DROP POLICY IF EXISTS "Users can view own finance data" ON user_finance_data;
DROP POLICY IF EXISTS "Users can delete own finance data" ON user_finance_data;

CREATE POLICY "Users can insert own finance data"
  ON user_finance_data
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can update own finance data"
  ON user_finance_data
  FOR UPDATE
  TO authenticated
  USING (uid() = user_id)
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can view own finance data"
  ON user_finance_data
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

CREATE POLICY "Users can delete own finance data"
  ON user_finance_data
  FOR DELETE
  TO authenticated
  USING (uid() = user_id);

-- Create user_voice_diary table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_voice_diary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  diary_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_voice_diary
ALTER TABLE user_voice_diary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_voice_diary
DROP POLICY IF EXISTS "Users can insert own voice diary" ON user_voice_diary;
DROP POLICY IF EXISTS "Users can update own voice diary" ON user_voice_diary;
DROP POLICY IF EXISTS "Users can view own voice diary" ON user_voice_diary;
DROP POLICY IF EXISTS "Users can delete own voice diary" ON user_voice_diary;

CREATE POLICY "Users can insert own voice diary"
  ON user_voice_diary
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can update own voice diary"
  ON user_voice_diary
  FOR UPDATE
  TO authenticated
  USING (uid() = user_id)
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can view own voice diary"
  ON user_voice_diary
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

CREATE POLICY "Users can delete own voice diary"
  ON user_voice_diary
  FOR DELETE
  TO authenticated
  USING (uid() = user_id);

-- Create user_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_documents
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_documents
DROP POLICY IF EXISTS "Users can insert own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can view own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON user_documents;

CREATE POLICY "Users can insert own documents"
  ON user_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON user_documents
  FOR UPDATE
  TO authenticated
  USING (uid() = user_id)
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can view own documents"
  ON user_documents
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON user_documents
  FOR DELETE
  TO authenticated
  USING (uid() = user_id);

-- Create user_notification_state table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_notification_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_notification_state
ALTER TABLE user_notification_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notification_state
DROP POLICY IF EXISTS "Users can insert own notification state" ON user_notification_state;
DROP POLICY IF EXISTS "Users can update own notification state" ON user_notification_state;
DROP POLICY IF EXISTS "Users can view own notification state" ON user_notification_state;
DROP POLICY IF EXISTS "Users can delete own notification state" ON user_notification_state;

CREATE POLICY "Users can insert own notification state"
  ON user_notification_state
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can update own notification state"
  ON user_notification_state
  FOR UPDATE
  TO authenticated
  USING (uid() = user_id)
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can view own notification state"
  ON user_notification_state
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

CREATE POLICY "Users can delete own notification state"
  ON user_notification_state
  FOR DELETE
  TO authenticated
  USING (uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_finance_data_user_id ON user_finance_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_voice_diary_user_id ON user_voice_diary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_state_user_id ON user_notification_state(user_id);

-- Add triggers for updating timestamps
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_user_finance_data_updated_at ON user_finance_data;
DROP TRIGGER IF EXISTS update_user_voice_diary_updated_at ON user_voice_diary;
DROP TRIGGER IF EXISTS update_user_documents_updated_at ON user_documents;
DROP TRIGGER IF EXISTS update_user_notification_state_updated_at ON user_notification_state;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_finance_data_updated_at
  BEFORE UPDATE ON user_finance_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_voice_diary_updated_at
  BEFORE UPDATE ON user_voice_diary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_state_updated_at
  BEFORE UPDATE ON user_notification_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();