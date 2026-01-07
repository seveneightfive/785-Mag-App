/*
  # Update advertisements table and add tracking tables

  1. Changes to advertisements table
    - Add `headline` (text) - Short catchy headline for the ad
    - Add `ad_copy` (text) - Main copy/description for the ad
    - Add `ad_image_url` (text) - URL of the uploaded ad image
    - Add `payment_status` (text) - Track payment status: pending, completed, failed
    - Add `status` (text) - Ad lifecycle status: draft, scheduled, active, paused, ended

  2. New Tables
    - `ad_impressions` - Track when ads are viewed
      - `id` (uuid, primary key)
      - `ad_id` (uuid, foreign key to advertisements)
      - `user_id` (uuid, nullable, foreign key to auth.users)
      - `viewed_at` (timestamptz)
      - `page_type` (text) - Which page the ad was viewed on
      - `position` (integer) - Position in the feed
      - `session_id` (text) - Browser session identifier

    - `ad_clicks` - Track when ads are clicked
      - `id` (uuid, primary key)
      - `ad_id` (uuid, foreign key to advertisements)
      - `user_id` (uuid, nullable, foreign key to auth.users)
      - `clicked_at` (timestamptz)
      - `page_type` (text) - Which page the ad was clicked on
      - `position` (integer) - Position in the feed
      - `session_id` (text) - Browser session identifier

  3. Indexes
    - Add indexes on ad_id for performance
    - Add indexes on viewed_at and clicked_at for analytics queries

  4. Security
    - Enable RLS on new tables
    - Allow public to insert impressions and clicks (anonymous tracking)
    - Allow users to query their own ad's analytics data
*/

-- Add new fields to advertisements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advertisements' AND column_name = 'headline'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN headline text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advertisements' AND column_name = 'ad_copy'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN ad_copy text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advertisements' AND column_name = 'ad_image_url'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN ad_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advertisements' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'advertisements' AND column_name = 'status'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'ended'));
  END IF;
END $$;

-- Create ad_impressions table
CREATE TABLE IF NOT EXISTS ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now(),
  page_type text NOT NULL,
  position integer NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create ad_clicks table
CREATE TABLE IF NOT EXISTS ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clicked_at timestamptz DEFAULT now(),
  page_type text NOT NULL,
  position integer NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_viewed_at ON ad_impressions(viewed_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_session ON ad_impressions(session_id, ad_id);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_clicked_at ON ad_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_session ON ad_clicks(session_id, ad_id);

-- Enable RLS
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_impressions
CREATE POLICY "Anyone can insert impressions"
  ON ad_impressions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view impressions for their ads"
  ON ad_impressions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM advertisements
      WHERE advertisements.id = ad_impressions.ad_id
      AND advertisements.user_id = auth.uid()
    )
  );

-- RLS Policies for ad_clicks
CREATE POLICY "Anyone can insert clicks"
  ON ad_clicks
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view clicks for their ads"
  ON ad_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM advertisements
      WHERE advertisements.id = ad_clicks.ad_id
      AND advertisements.user_id = auth.uid()
    )
  );

-- Create view for ad analytics aggregation
CREATE OR REPLACE VIEW ad_analytics AS
SELECT
  a.id as ad_id,
  a.title,
  a.headline,
  a.user_id,
  a.start_date,
  a.end_date,
  a.status,
  COUNT(DISTINCT ai.id) as total_impressions,
  COUNT(DISTINCT ac.id) as total_clicks,
  CASE
    WHEN COUNT(DISTINCT ai.id) > 0
    THEN ROUND((COUNT(DISTINCT ac.id)::numeric / COUNT(DISTINCT ai.id)::numeric) * 100, 2)
    ELSE 0
  END as ctr_percentage
FROM advertisements a
LEFT JOIN ad_impressions ai ON a.id = ai.ad_id
LEFT JOIN ad_clicks ac ON a.id = ac.ad_id
GROUP BY a.id, a.title, a.headline, a.user_id, a.start_date, a.end_date, a.status;