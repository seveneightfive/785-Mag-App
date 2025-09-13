/*
  # Create Menu Procs table

  1. New Tables
    - `menu_procs`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `content` (text, required)
      - `images` (text array, up to 3 images)
      - `venue_id` (uuid, foreign key to venues)
      - `user_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `menu_procs` table
    - Add policies for authenticated users to create menu procs
    - Add policy for public to view menu procs
    - Add policies for users to update/delete own menu procs

  3. Indexes
    - Add indexes for performance on venue_id, user_id, and created_at
*/

CREATE TABLE IF NOT EXISTS menu_procs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  images text[] DEFAULT '{}',
  venue_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE menu_procs 
ADD CONSTRAINT menu_procs_venue_id_fkey 
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

ALTER TABLE menu_procs 
ADD CONSTRAINT menu_procs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_procs_venue ON menu_procs(venue_id);
CREATE INDEX IF NOT EXISTS idx_menu_procs_user ON menu_procs(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_procs_created_at ON menu_procs(created_at DESC);

-- Enable RLS
ALTER TABLE menu_procs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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