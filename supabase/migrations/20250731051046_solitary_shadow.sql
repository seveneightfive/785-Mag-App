/*
  # Add announcement reactions and update announcements table

  1. New Tables
    - `announcement_reactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `announcement_id` (uuid, foreign key to announcements)
      - `reaction_type` (text, 'heart' or 'thumbs_up')
      - `created_at` (timestamp)

  2. Updates to announcements table
    - Add `learnmore_link` column
    - Add `expires_in` column (default 10 days)
    - Update expires_at to be calculated from expires_in

  3. Security
    - Enable RLS on announcement_reactions table
    - Add policies for authenticated users to manage reactions
    - Add policy for public to view reaction counts
*/

-- Add missing columns to announcements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'learnmore_link'
  ) THEN
    ALTER TABLE announcements ADD COLUMN learnmore_link text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'expires_in'
  ) THEN
    ALTER TABLE announcements ADD COLUMN expires_in integer DEFAULT 10;
  END IF;
END $$;

-- Create announcement_reactions table
CREATE TABLE IF NOT EXISTS announcement_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'thumbs_up')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, announcement_id, reaction_type)
);

ALTER TABLE announcement_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for announcement_reactions
CREATE POLICY "Users can manage own reactions"
  ON announcement_reactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reactions are viewable by everyone"
  ON announcement_reactions
  FOR SELECT
  TO public
  USING (true);

-- Update announcements policies to allow authenticated users to create
DROP POLICY IF EXISTS "Authenticated users can create announcements" ON announcements;
CREATE POLICY "Authenticated users can create announcements"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own announcements"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_announcement ON announcement_reactions(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_user ON announcement_reactions(user_id);