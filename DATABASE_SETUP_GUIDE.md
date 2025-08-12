# Dream Suite Database Setup Guide

This guide will help you properly configure the Supabase database for Dream Suite's booking platform with super admin functionality.

## Prerequisites

1. Active Supabase project
2. Access to Supabase SQL Editor
3. Environment variables configured in your `.env.local` file

## Step 1: Execute Base Database Setup

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-setup.sql` into a new query
4. Click **Run** to execute the base schema

**Expected Output:** Tables created, indexes added, RLS policies enabled.

## Step 2: Add Test Data

1. In SQL Editor, create a new query
2. Copy and paste the contents of `test-data-setup.sql`
3. Click **Run** to create the Sweet Dreams Studio and sample services

**Expected Output:** Sweet Dreams Studio created with 9 services and availability schedule.

## Step 3: Execute Super Admin Setup (CORRECTED VERSION)

1. In SQL Editor, create a new query
2. Copy and paste the contents of `super-admin-setup-corrected.sql`
3. Click **Run** to set up super admin functionality

**Expected Output:**
- `user_profiles` table created
- `user_roles` table created
- Sweet Dreams Studio marked as super admin studio
- Trigger function created for automatic user profile creation

## Step 4: Verify Database Configuration

1. In SQL Editor, create a new query
2. Copy and paste the contents of `database-verification.sql`
3. Click **Run** to verify all components are properly configured

**Expected Results:**
- All required tables exist
- Sweet Dreams Studio configured as super admin studio
- 9 services active
- 7 days of availability configured
- RLS enabled on all tables
- Trigger functions exist
- Permissions granted properly

## Step 5: Test Authentication Flow

### 5.1 Test Super Admin Assignment

1. Sign up using the email `jayvalleo@sweetdreamsmusic.com` in your React Native app
2. Check the database to verify:
   ```sql
   SELECT 
     up.email,
     up.is_super_admin,
     s.name as studio_name,
     s.owner_id,
     ur.role
   FROM user_profiles up
   LEFT JOIN studios s ON s.owner_id = up.user_id
   LEFT JOIN user_roles ur ON ur.user_id = up.user_id
   WHERE up.email = 'jayvalleo@sweetdreamsmusic.com';
   ```

**Expected Result:**
- User profile created with `is_super_admin = true`
- Sweet Dreams Studio assigned to this user as owner
- Super admin role assigned in user_roles table

### 5.2 Test Regular User Registration

1. Sign up with a different email in your React Native app
2. Verify regular user creation:
   ```sql
   SELECT 
     email,
     is_super_admin,
     created_at
   FROM user_profiles 
   WHERE email != 'jayvalleo@sweetdreamsmusic.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Expected Result:**
- User profile created with `is_super_admin = false`
- No studio ownership assigned
- No special roles assigned

## Step 6: Test RLS Policies

### 6.1 Test Studio Access
```sql
-- Test as anonymous user (should see onboarded studios)
SET ROLE anon;
SELECT name, onboarded FROM studios WHERE onboarded = true;

-- Reset to default role
RESET ROLE;
```

### 6.2 Test Service Access
```sql
-- Test as anonymous user (should see active services)
SET ROLE anon;
SELECT name, active, price_cents FROM services WHERE active = true;

-- Reset to default role
RESET ROLE;
```

## Step 7: Environment Variables

Ensure your `.env.local` file contains:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### Common Issues

1. **Trigger function not found**
   - Ensure `update_updated_at_column()` function exists from base schema
   - Re-run `supabase-setup.sql` if needed

2. **RLS blocking queries**
   - Check that proper policies are created
   - Verify user authentication in app

3. **User not becoming super admin**
   - Check exact email spelling: `jayvalleo@sweetdreamsmusic.com`
   - Verify trigger is properly installed
   - Check auth.users table for user creation

4. **Sweet Dreams Studio not found**
   - Ensure `test-data-setup.sql` was run successfully
   - Check UUID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Verification Commands

After each step, you can run:

```sql
-- Quick health check
SELECT 
  'Database Setup Status' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM studios WHERE is_super_admin = true)
    AND EXISTS (SELECT 1 FROM user_profiles)
    AND EXISTS (SELECT 1 FROM services WHERE active = true)
    THEN '✅ READY'
    ELSE '❌ INCOMPLETE'
  END as status;
```

## Next Steps

Once database setup is complete:

1. Test user registration in React Native app
2. Verify authentication flow
3. Test booking creation
4. Verify RLS policies in production environment

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard > Logs
2. Verify environment variables
3. Test SQL queries individually
4. Check network connectivity between app and Supabase