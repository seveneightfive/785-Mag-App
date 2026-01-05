/*
  # Add Event Edit Permissions for Venue and Artist Creators

  1. Changes
    - Drop existing restrictive event update policy
    - Create new comprehensive update policy allowing:
      * Event creators to edit their events
      * Venue creators to edit events at their venues
      * Artist creators to edit events featuring their artists
    
  2. Security
    - Maintains RLS protection
    - Adds proper permission checks for multi-level ownership
    - Ensures authenticated users only

  3. Performance
    - Add indexes for created_by lookups
*/

-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Users can update events they created" ON events;

-- Create comprehensive update policy for events
CREATE POLICY "Users can update events they created or are associated with"
  ON events
  FOR UPDATE
  TO authenticated
  USING (
    -- User created the event directly
    auth.uid() = created_by
    OR
    -- User created the venue where the event takes place
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = events.venue_id
      AND venues.created_by = auth.uid()
    )
    OR
    -- User created any artist featured in the event
    EXISTS (
      SELECT 1 FROM event_artists
      JOIN artists ON artists.id = event_artists.artist_id
      WHERE event_artists.event_id = events.id
      AND artists.created_by = auth.uid()
    )
  )
  WITH CHECK (
    -- Same conditions for the updated data
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = events.venue_id
      AND venues.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM event_artists
      JOIN artists ON artists.id = event_artists.artist_id
      WHERE event_artists.event_id = events.id
      AND artists.created_by = auth.uid()
    )
  );

-- Add indexes for better performance on ownership lookups
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_venues_created_by ON venues(created_by);
CREATE INDEX IF NOT EXISTS idx_artists_created_by ON artists(created_by);
