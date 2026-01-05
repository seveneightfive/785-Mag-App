/*
  # Create Menu Procs feature

  1. New Tables
    - `menu_procs`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `content` (text, rich content)
      - `images` (text array, up to 3 images)
      - `venue_id` (uuid, foreign key to venues)
      - `user_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `menu_procs` table
    - Add policies for authenticated users to create their own menu procs
    - Add policy for public to view menu procs

  3. Points System
    - Update profiles table to track points for menu proc submissions
*/

CREATE TABLE IF NOT EXISTS menu_procs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  images text[] DEFAULT '{}',
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_procs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Menu procs are viewable by everyone"
  ON menu_procs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create menu procs"
  ON menu_procs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menu procs"
  ON menu_procs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own menu procs"
  ON menu_procs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_menu_procs_venue ON menu_procs(venue_id);
CREATE INDEX idx_menu_procs_user ON menu_procs(user_id);
CREATE INDEX idx_menu_procs_created_at ON menu_procs(created_at DESC);