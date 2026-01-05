/*
  # Create page_views table for analytics

  1. New Tables
    - `page_views`
      - `id` (uuid, primary key)
      - `page_type` (text, required) - Type of page being viewed
      - `page_id` (text, optional) - ID of specific entity being viewed
      - `user_id` (uuid, optional) - User who viewed the page (if authenticated)
      - `created_at` (timestamp) - When the page view occurred

  2. Security
    - Enable RLS on `page_views` table
    - Add policy for authenticated users to insert their own page views
    - Add policy for anonymous users to insert page views
*/

CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL,
  page_id text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own page views
CREATE POLICY "Users can insert their own page views"
  ON page_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert page views (user_id will be null)
CREATE POLICY "Anonymous users can insert page views"
  ON page_views
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Optional: Allow reading page views for analytics (adjust as needed)
CREATE POLICY "Service role can read all page views"
  ON page_views
  FOR SELECT
  TO service_role;