# EventHub - Airtable Version

## Setup
A local events and artists directory application powered by Airtable.
1. Install dependencies:
```bash
npm install
```
2. Set up your Airtable base:
   - Create a new Airtable base
   - Create tables for: profiles, events, artists, venues, reviews, follows, announcements, advertisements, menu_procs, works, event_rsvps, event_artists, announcement_reactions, page_views
   - Get your API key from https://airtable.com/account
   - Get your base ID from the Airtable API documentation
3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Airtable API key and base ID
4. Start the development server:
```bash
npm run dev
```
## Airtable Schema
You'll need to create the following tables in your Airtable base:
### profiles
- id (Single line text)
- username (Single line text)
- full_name (Single line text)
- avatar_url (URL)
- bio (Long text)
- website (URL)
- points (Number)
- created_at (Date)
- updated_at (Date)
### events
- id (Single line text)
- title (Single line text)
- description (Long text)
- start_date (Date)
- end_date (Date)
- event_start_time (Single line text)
- event_end_time (Single line text)
- venue_id (Single line text)
- ticket_price (Number)
- ticket_url (URL)
- image_url (URL)
- event_type (Single line text)
- event_types (Multiple select)
- capacity (Number)
- created_by (Single line text)
- slug (Single line text)
- star (Checkbox)
- created_at (Date)
- updated_at (Date)
### artists
- id (Single line text)
- name (Single line text)
- bio (Long text)
- genre (Single line text)
- website (URL)
- social_links (Long text - JSON)
- image_url (URL)
- verified (Checkbox)
- created_by (Single line text)
- slug (Single line text)
- artist_type (Single select)
- musical_genres (Multiple select)
- visual_mediums (Multiple select)
- audio_file_url (URL)
- audio_title (Single line text)
- video_url (URL)
- video_title (Single line text)
- purchase_link (URL)
- tagline (Single line text)
- avatar_url (URL)
- artist_website (URL)
- social_facebook (URL)
- artist_spotify (URL)
- artist_youtube (URL)
- artist_email (Email)
- created_at (Date)
- updated_at (Date)
### venues
- id (Single line text)
- name (Single line text)
- description (Long text)
- address (Single line text)
- city (Single line text)
- state (Single line text)
- country (Single line text)
- phone (Phone number)
- email (Email)
- website (URL)
- capacity (Number)
- venue_type (Single select)
- venue_types (Multiple select)
- image_url (URL)
- logo (URL)
- created_by (Single line text)
- slug (Single line text)
- neighborhood (Single select)
- created_at (Date)
- updated_at (Date)
And similar schemas for other tables (reviews, follows, announcements, etc.)
## Features
- Browse events, artists, and venues
- User profiles and authentication (mock implementation)
- Reviews and ratings
- Menu Procs for restaurants
- Announcements and advertisements
- Follow artists and venues
- RSVP to events
## Note
This version uses Airtable as the backend instead of Supabase. Authentication is implemented as a mock system since Airtable doesn't provide built-in authentication. You may want to integrate with a proper authentication service like Auth0, Firebase Auth, or implement your own authentication system.