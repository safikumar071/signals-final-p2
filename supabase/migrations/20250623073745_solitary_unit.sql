/*
  # Add user profile fields for onboarding

  1. Schema Updates
    - Add `name` field to user_profiles
    - Add `dob` (date of birth) field
    - Add `language` field for language preferences
    - Add `onboarding_completed` field to track completion status

  2. Security
    - Maintain existing RLS policies
    - No breaking changes to existing data
*/

-- Add new columns to user_profiles table
DO $$
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN name text;
  END IF;

  -- Add date of birth column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'dob'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN dob date;
  END IF;

  -- Add language column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN language text DEFAULT 'en';
  END IF;

  -- Add onboarding completed flag if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;