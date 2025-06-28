/*
  # Create user_profiles table for push notification management

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (text, unique) - Device ID used as unique identifier
      - `expo_push_token` (text) - Expo push token for notifications
      - `device_type` (text) - Device type: 'ios', 'android', or 'web'
      - `app_version` (text) - App version (e.g., '1.0.0')
      - `last_active` (timestamptz) - Last activity timestamp
      - `created_at` (timestamptz) - Row creation time

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for device-based access (no authentication required)

  3. Indexes
    - Unique index on `user_id` for performance
    - Index on `last_active` for analytics queries
*/

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  expo_push_token text,
  device_type text,
  app_version text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add check constraint for device_type
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_device_type_check 
CHECK (device_type IN ('ios', 'android', 'web'));

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON public.user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active 
ON public.user_profiles(last_active);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for all access patterns
CREATE POLICY "Allow all device-based actions" 
ON public.user_profiles
FOR ALL 
TO anon
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access" 
ON public.user_profiles
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow service role full access" 
ON public.user_profiles
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);