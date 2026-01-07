/*
  # Create Organizers and Event Organizers Tables

  1. New Tables
    - `organizers`
      - `id` (uuid, primary key)
      - `name` (text, required) - Organization name
      - `description` (text) - Short description
      - `bio` (text) - Longer biographical information
      - `logo` (text) - Logo image URL
      - `image_url` (text) - Banner/cover image URL
      - `website` (text) - Organization website
      - `email` (text) - Contact email
      - `phone` (text) - Contact phone number
      - `social_links` (jsonb) - Social media links as JSON object
      - `verified` (boolean) - Verified organizer badge
      - `slug` (text, unique) - URL-friendly identifier
      - `created_by` (uuid) - Reference to profiles table
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `event_organizers`
      - `id` (uuid, primary key)
      - `event_id` (uuid) - Reference to events table
      - `organizer_id` (uuid) - Reference to organizers table
      - `created_at` (timestamptz) - Creation timestamp
      - Unique constraint on (event_id, organizer_id)

  2. Security
    - Enable RLS on both tables
    - Public can view organizers
    - Authenticated users can create organizers
    - Users can update organizers they created
    - Public can view event_organizers relationships
    - Authenticated users can manage event_organizers for events they created

  3. Indexes
    - Index on organizers.slug for fast lookups
    - Index on event_organizers.event_id for event queries
    - Index on event_organizers.organizer_id for organizer queries
*/

-- Create organizers table
CREATE TABLE IF NOT EXISTS organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  bio text,
  logo text,
  image_url text,
  website text,
  email text,
  phone text,
  social_links jsonb DEFAULT '{}',
  verified boolean DEFAULT false,
  slug text UNIQUE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_organizers junction table
CREATE TABLE IF NOT EXISTS event_organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  organizer_id uuid REFERENCES organizers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, organizer_id)
);

-- Enable RLS
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

-- Organizers policies
CREATE POLICY "Organizers are viewable by everyone"
  ON organizers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create organizers"
  ON organizers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update organizers they created"
  ON organizers FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete organizers they created"
  ON organizers FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Event organizers policies
CREATE POLICY "Event organizers are viewable by everyone"
  ON event_organizers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can link organizers to events they created"
  ON event_organizers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can remove organizers from events they created"
  ON event_organizers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.created_by = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizers_slug ON organizers(slug);
CREATE INDEX IF NOT EXISTS idx_organizers_created_by ON organizers(created_by);
CREATE INDEX IF NOT EXISTS idx_event_organizers_event ON event_organizers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_organizer ON event_organizers(organizer_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organizers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizers_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_organizers_updated_at_trigger
      BEFORE UPDATE ON organizers
      FOR EACH ROW
      EXECUTE FUNCTION update_organizers_updated_at();
  END IF;
END $$;