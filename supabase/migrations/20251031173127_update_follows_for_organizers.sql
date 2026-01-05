/*
  # Update follows table to support organizers

  1. Changes
    - Update the CHECK constraint on follows table to include 'organizer' as a valid entity_type
    - This allows users to follow organizers in addition to artists, venues, and users

  2. Security
    - No changes to RLS policies needed - existing policies already support any entity_type
*/

-- Drop the existing constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'follows_entity_type_check'
  ) THEN
    ALTER TABLE follows DROP CONSTRAINT follows_entity_type_check;
  END IF;
END $$;

-- Add updated constraint that includes 'organizer'
ALTER TABLE follows ADD CONSTRAINT follows_entity_type_check
  CHECK (entity_type IN ('artist', 'venue', 'user', 'event', 'organizer'));