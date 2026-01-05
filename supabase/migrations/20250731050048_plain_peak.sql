/*
  # Add image support to reviews

  1. Schema Changes
    - Add `image_url` column to reviews table
    - Allow users to attach images to their reviews

  2. Security
    - Maintain existing RLS policies
    - No additional security changes needed as image URLs are just text fields
*/

-- Add image_url column to reviews table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE reviews ADD COLUMN image_url text;
  END IF;
END $$;