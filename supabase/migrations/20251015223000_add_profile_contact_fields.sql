/*
  # Add contact fields to profiles table

  1. Changes
    - Add `phone_number` column to store user phone numbers (for email auth users)
    - Add `email` column to store user email addresses (for phone auth users)
    - Both fields are optional as they depend on authentication method used

  2. Notes
    - phone_number will be populated for users who authenticate with email
    - email will be populated for users who authenticate with phone
    - These fields complement the auth system's primary authentication field
    - Supports profile completion flow after login/signup
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;
