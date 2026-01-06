import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Profile {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  bio?: string
  website?: string
  created_at?: string
  updated_at?: string
}

export interface Event {
  id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  event_start_time?: string
  event_end_time?: string
  venue_id?: string
  ticket_price?: number
  ticket_url?: string
  image_url?: string
  event_type?: string
  event_types?: string[]
  capacity?: number
  created_by?: string
  created_at?: string
  updated_at?: string
  slug?: string
  venue?: Venue
  event_artists?: {
    artist: Artist
  }[]
}

export interface Artist {
  id: string
  name: string
  bio?: string
  genre?: string
  website?: string
  social_links?: any
  image_url?: string
  verified?: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
  slug?: string
  artist_type?: string
  musical_genres?: string[]
  visual_mediums?: string[]
  audio_file_url?: string
  audio_title?: string
  video_url?: string
  video_title?: string
  artistvideoabout?: string
  purchase_link?: string
  tagline?: string
  avatar_url?: string
  artist_website?: string
  social_facebook?: string
  artist_spotify?: string
  artist_youtube?: string
  artist_email?: string
}

export interface Venue {
  id: string
  name: string
  description?: string
  address: string
  city: string
  state?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  capacity?: number
  venue_type: string
  venue_types?: string[]
  image_url?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  slug?: string
  neighborhood?: string
}

export interface Review {
  id: string
  user_id?: string
  entity_type: string
  entity_id: string
  rating: number
  title?: string
  content?: string
  created_at?: string
  updated_at?: string
  profiles?: Profile
}

export interface Work {
  id: string
  title: string
  image_url?: string
  medium?: string
  size?: string
  artist_id?: string
  price?: number
  about?: string
  location?: string
  exhibit?: string
  event_id?: string
  venue_id?: string
  user_id?: string
  is_for_sale?: boolean
  is_in_collection?: boolean
  created_at?: string
  updated_at?: string
  artist?: Artist
}

export interface Announcement {
  id: string
  title: string
  content: string
  entity_type?: string
  entity_id?: string
  priority?: number
  active?: boolean
  expires_at?: string
  created_by?: string
  created_at?: string
}

export interface Follow {
  id: string
  follower_id?: string
  entity_type: string
  entity_id: string
  created_at?: string
}

export interface EventRSVP {
  id: string
  user_id?: string
  event_id?: string
  status: string
  created_at?: string
}

// Utility Functions
export const trackPageView = async (pageType: string, pageId?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('page_views')
      .insert({
        page_type: pageType,
        page_id: pageId,
        user_id: user?.id
      })
    
    if (error) {
      console.warn('Page view tracking failed:', error.message)
    }
  } catch (error) {
    // Silently handle network/service errors to prevent disrupting user experience
    console.warn('Page view tracking unavailable:', error instanceof Error ? error.message : 'Unknown error')
  }
}
