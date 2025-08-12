-- Super Admin Setup for Dream Suite (CORRECTED VERSION)
-- This script sets up jayvalleo@sweetdreamsmusic.com as the permanent super admin
-- Run this in your Supabase SQL Editor

-- First, we need to add a super_admin column to studios table
ALTER TABLE studios ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Create a user roles table for more granular permissions
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'studio_owner', 'studio_manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, studio_id, role)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_studio_id ON user_roles(studio_id);

-- Update Sweet Dreams Studio to be the super admin studio
UPDATE studios 
SET 
  is_super_admin = true,
  owner_id = null -- Will be set when jayvalleo signs up
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Add a user_profiles table to store additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_super_admin ON user_profiles(is_super_admin);

-- Create triggers for updated_at (reuse existing function)
CREATE TRIGGER IF NOT EXISTS update_user_roles_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for user roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_super_admin = true
    )
  );

CREATE POLICY "Studio owners can manage their studio roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = user_roles.studio_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.is_super_admin = true
    )
  );

-- Create a function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, is_super_admin)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    CASE WHEN new.email = 'jayvalleo@sweetdreamsmusic.com' THEN true ELSE false END
  );

  -- If this is the super admin, assign them to Sweet Dreams Studio
  IF new.email = 'jayvalleo@sweetdreamsmusic.com' THEN
    -- Update Sweet Dreams Studio to have this user as owner
    UPDATE studios 
    SET owner_id = new.id 
    WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    
    -- Add super admin role
    INSERT INTO user_roles (user_id, studio_id, role)
    VALUES (new.id, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'super_admin');
  END IF;

  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger to run the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Test query to verify setup
SELECT 
  'Super admin setup complete. Sweet Dreams Studio:' as message,
  studios.name,
  studios.is_super_admin,
  studios.owner_id,
  'Should be null until jayvalleo signs up' as owner_note
FROM studios 
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Additional verification queries
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_name IN ('user_profiles', 'user_roles') AND table_schema = 'public';