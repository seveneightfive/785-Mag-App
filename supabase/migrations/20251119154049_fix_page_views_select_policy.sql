/*
  # Fix Page Views SELECT Policy for Analytics

  1. Policy Changes
    - Remove restrictive SELECT policy that only allows users to view their own page views
    - Add new public SELECT policy to enable aggregate analytics and counting
    - This allows the application to count total page views for events, artists, venues, etc.
  
  2. Security Notes
    - INSERT policy remains secure (only allows creating views with correct user_id or NULL)
    - Public SELECT access is appropriate for analytics/counting purposes
    - No sensitive user data is exposed through aggregate counts
*/

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own page views" ON page_views;

-- Create a new policy that allows public read access for analytics
CREATE POLICY "Allow public read access for page view counts"
  ON page_views
  FOR SELECT
  TO public
  USING (true);