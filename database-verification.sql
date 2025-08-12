-- Database Verification Script for Dream Suite
-- Run these queries in Supabase to verify your setup

-- 1. Check if all required tables exist
SELECT 'Checking table existence...' as step;
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('studios', 'services', 'bookings', 'studio_availability', 'user_profiles', 'user_roles')
ORDER BY table_name;

-- 2. Check if Sweet Dreams Studio exists and is configured
SELECT 'Checking Sweet Dreams Studio configuration...' as step;
SELECT 
  name,
  email,
  is_super_admin,
  owner_id,
  onboarded,
  CASE 
    WHEN owner_id IS NULL THEN 'Ready for owner assignment'
    ELSE 'Owner already assigned'
  END as owner_status
FROM studios 
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- 3. Check if services are properly set up
SELECT 'Checking services for Sweet Dreams Studio...' as step;
SELECT 
  COUNT(*) as service_count,
  STRING_AGG(name, ', ' ORDER BY name) as services
FROM services 
WHERE studio_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 
AND active = true;

-- 4. Check studio availability
SELECT 'Checking studio availability...' as step;
SELECT 
  day_of_week,
  CASE day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday' 
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  open_time,
  close_time,
  is_available
FROM studio_availability 
WHERE studio_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY day_of_week;

-- 5. Check RLS policies are enabled
SELECT 'Checking Row Level Security...' as step;
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('studios', 'services', 'bookings', 'studio_availability', 'user_profiles', 'user_roles');

-- 6. Check if the trigger function exists
SELECT 'Checking trigger functions...' as step;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'update_updated_at_column', 'is_time_slot_available');

-- 7. Check if triggers are properly set up
SELECT 'Checking triggers...' as step;
SELECT 
  trigger_name,
  event_object_table,
  trigger_schema
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%user%'
ORDER BY trigger_name;

-- 8. Test data verification
SELECT 'Summary of database setup...' as step;
SELECT 
  'Studios' as table_name, 
  COUNT(*) as record_count 
FROM studios
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Studio Availability', COUNT(*) FROM studio_availability
UNION ALL
SELECT 'User Profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'User Roles', COUNT(*) FROM user_roles;

-- 9. Check permissions
SELECT 'Checking table permissions...' as step;
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated')
AND table_name IN ('studios', 'services', 'bookings', 'user_profiles', 'user_roles')
ORDER BY table_name, grantee;