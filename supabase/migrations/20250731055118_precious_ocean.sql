/*
  # Create advertisements table

  1. New Tables
    - `advertisements`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `background_image` (text, optional)
      - `button_text` (text)
      - `button_link` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `views` (integer, default 0)
      - `clicks` (integer, default 0)
      - `user_id` (uuid, foreign key to profiles)
      - `duration` (integer, 5 or 14 days)
      - `price` (integer, $10 for 5 days, $15 for 14 days)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `advertisements` table
    - Add policies for authenticated users to create and manage their own ads
    - Add policy for public to view active ads
*/

CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  background_image text,
  button_text text NOT NULL,
  button_link text NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  duration integer NOT NULL CHECK (duration IN (5, 14)),
  price integer NOT NULL CHECK (price IN (1000, 1500)),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Policy for public to view active ads
CREATE POLICY "Active ads are viewable by everyone"
  ON advertisements
  FOR SELECT
  TO public
  USING (
    start_date <= CURRENT_DATE AND 
    end_date >= CURRENT_DATE
  );

-- Policy for authenticated users to create ads
CREATE POLICY "Authenticated users can create ads"
  ON advertisements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to view their own ads
CREATE POLICY "Users can view own ads"
  ON advertisements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to update their own ads
CREATE POLICY "Users can update own ads"
  ON advertisements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically set end_date based on start_date + duration
CREATE OR REPLACE FUNCTION set_advertisement_end_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.end_date = NEW.start_date + (NEW.duration || ' days')::interval;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set end_date
CREATE TRIGGER trigger_set_advertisement_end_date
  BEFORE INSERT OR UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION set_advertisement_end_date();