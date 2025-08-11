-- Dream Suite Booking Platform Database Setup
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create studios table
CREATE TABLE IF NOT EXISTS studios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  description TEXT,
  website TEXT,
  instagram TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'past_due')),
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('recording', 'mixing', 'mastering', 'consultation', 'other')),
  requires_deposit BOOLEAN DEFAULT false,
  deposit_percentage INTEGER DEFAULT 50,
  max_advance_booking_days INTEGER DEFAULT 30,
  min_advance_booking_hours INTEGER DEFAULT 24,
  active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'paid', 'refunded', 'expired')),
  total_price_cents INTEGER NOT NULL,
  stripe_session_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create studio_availability table for managing working hours
CREATE TABLE IF NOT EXISTS studio_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(studio_id, day_of_week)
);

-- Create indexes for performance
CREATE INDEX idx_studios_owner_id ON studios(owner_id);
CREATE INDEX idx_services_studio_id ON services(studio_id);
CREATE INDEX idx_bookings_studio_id ON bookings(studio_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_studio_availability_studio_id ON studio_availability(studio_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studio_availability_updated_at BEFORE UPDATE ON studio_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_availability ENABLE ROW LEVEL SECURITY;

-- Studios policies
-- Anyone can view onboarded studios
CREATE POLICY "Studios are viewable by everyone" ON studios
  FOR SELECT USING (onboarded = true);

-- Studio owners can manage their own studio
CREATE POLICY "Studio owners can update their studio" ON studios
  FOR ALL USING (auth.uid() = owner_id);

-- Services policies  
-- Anyone can view active services
CREATE POLICY "Active services are viewable by everyone" ON services
  FOR SELECT USING (active = true);

-- Studio owners can manage their services
CREATE POLICY "Studio owners can manage their services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = services.studio_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- Bookings policies
-- Anyone can create bookings (for clients)
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Clients can view their own bookings by email
CREATE POLICY "Clients can view their bookings" ON bookings
  FOR SELECT USING (
    client_email = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = bookings.studio_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- Studio owners can manage bookings for their studio
CREATE POLICY "Studio owners can manage their bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = bookings.studio_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- Studio availability policies
-- Anyone can view availability
CREATE POLICY "Availability is viewable by everyone" ON studio_availability
  FOR SELECT USING (true);

-- Studio owners can manage their availability
CREATE POLICY "Studio owners can manage their availability" ON studio_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM studios 
      WHERE studios.id = studio_availability.studio_id 
      AND studios.owner_id = auth.uid()
    )
  );

-- Create a function to check booking availability
CREATE OR REPLACE FUNCTION is_time_slot_available(
  p_studio_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE studio_id = p_studio_id
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    )
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Create sample studio for testing (optional)
-- Uncomment the lines below if you want to create a test studio
/*
INSERT INTO studios (name, email, description, onboarded)
VALUES (
  'Test Studio',
  'test@dreamsuite.com',
  'A test studio for development',
  true
);
*/

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;