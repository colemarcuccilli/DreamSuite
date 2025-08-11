-- Test Data Setup for Dream Suite Booking Platform
-- Run this in Supabase SQL Editor to create test studio and services

-- First, let's create a test user (you'll need to sign up through the app to get a real user ID)
-- For now, we'll create a test studio without an owner

-- Create a test studio
INSERT INTO studios (
  id,
  name,
  email,
  phone,
  address,
  city,
  state,
  zip,
  description,
  website,
  instagram,
  onboarded,
  subscription_status
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Sweet Dreams Music Studio',
  'studio@sweetdreamsmusic.com',
  '(555) 123-4567',
  '123 Music Lane',
  'Nashville',
  'TN',
  '37201',
  'Professional recording studio offering state-of-the-art equipment and experienced engineers for all your music production needs.',
  'https://sweetdreamsmusic.com',
  '@sweetdreamsmusic',
  true,
  'active'
);

-- Create services for the studio
INSERT INTO services (studio_id, name, description, duration_minutes, price_cents, category, requires_deposit, deposit_percentage, active) VALUES
-- Recording Services
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Basic Recording Session (2 Hours)', 
 'Perfect for demos and single tracks. Includes engineer and basic equipment setup.', 
 120, 
 15000, 
 'recording', 
 true, 
 50, 
 true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Full Day Recording (8 Hours)', 
 'Full day session with engineer, all equipment, and complimentary refreshments.', 
 480, 
 50000, 
 'recording', 
 true, 
 50, 
 true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Vocal Recording Session (1 Hour)', 
 'Dedicated vocal booth session with professional mic selection and comp recording.', 
 60, 
 10000, 
 'recording', 
 false, 
 null, 
 true),

-- Mixing Services
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Single Track Mixing', 
 'Professional mixing for one song, includes up to 3 revisions.', 
 240, 
 30000, 
 'mixing', 
 true, 
 30, 
 true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Album Mixing (10 Songs)', 
 'Complete album mixing package with consistent sound across all tracks.', 
 2400, 
 200000, 
 'mixing', 
 true, 
 40, 
 true),

-- Mastering Services
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Single Track Mastering', 
 'Radio-ready mastering for streaming platforms and physical media.', 
 120, 
 15000, 
 'mastering', 
 false, 
 null, 
 true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'EP Mastering (5 Songs)', 
 'Complete EP mastering with consistent loudness and tonal balance.', 
 360, 
 60000, 
 'mastering', 
 true, 
 30, 
 true),

-- Consultation Services
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Production Consultation', 
 'One-on-one consultation for your music project planning and execution.', 
 60, 
 12500, 
 'consultation', 
 false, 
 null, 
 true),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 
 'Artist Development Session', 
 'Comprehensive review of your music, brand, and career strategy.', 
 90, 
 20000, 
 'consultation', 
 false, 
 null, 
 true);

-- Create studio availability (Monday-Saturday, 9 AM - 10 PM)
INSERT INTO studio_availability (studio_id, day_of_week, open_time, close_time, is_available) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, '10:00:00', '18:00:00', false), -- Sunday (closed)
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, '09:00:00', '22:00:00', true),  -- Monday
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, '09:00:00', '22:00:00', true),  -- Tuesday
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, '09:00:00', '22:00:00', true),  -- Wednesday
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, '09:00:00', '22:00:00', true),  -- Thursday
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, '09:00:00', '22:00:00', true),  -- Friday
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6, '10:00:00', '20:00:00', true);  -- Saturday

-- Verify the data was inserted
SELECT 'Test studio created with ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890' as message;
SELECT COUNT(*) as service_count FROM services WHERE studio_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
SELECT COUNT(*) as availability_count FROM studio_availability WHERE studio_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';