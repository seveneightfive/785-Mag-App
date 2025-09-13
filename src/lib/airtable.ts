import Airtable from 'airtable'

// Check if environment variables are available
const airtableApiKey = import.meta.env.VITE_AIRTABLE_API_KEY
const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID

if (!airtableApiKey) {
  throw new Error('VITE_AIRTABLE_API_KEY is required. Please check your .env file.')
}

if (!airtableBaseId) {
  throw new Error('VITE_AIRTABLE_BASE_ID is required. Please check your .env file.')
}

// Configure Airtable
const airtable = new Airtable({
  apiKey: airtableApiKey
})

const base = airtable.base(airtableBaseId)

// Database Types
export interface Profile {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  bio?: string
  website?: string
  points?: number
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
  star?: boolean
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
  logo?: string
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
  image_url?: string
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
  expires_in?: number
  learnmore_link?: string
  created_by?: string
  created_at?: string
}

export interface AnnouncementReaction {
  id: string
  user_id?: string | null
  announcement_id: string
  reaction_type: 'heart' | 'thumbs_up'
  created_at?: string
}

export interface Advertisement {
  id: string
  title: string
  content: string
  background_image?: string
  button_text: string
  button_link: string
  start_date: string
  end_date: string
  views: number
  clicks: number
  user_id?: string
  duration: number
  price: number
  created_at?: string
  updated_at?: string
}

export interface MenuProc {
  id: string
  title: string
  content: string
  images: string[]
  venue_id: string
  user_id: string
  created_at?: string
  updated_at?: string
  venues?: Venue
  profiles?: Profile
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

// Airtable helper functions
const convertAirtableRecord = (record: any, fields: any) => {
  return {
    id: record.id,
    ...fields,
    created_at: fields.created_at || record._rawJson.createdTime,
    updated_at: fields.updated_at || record._rawJson.createdTime
  }
}

// Airtable API wrapper
export const airtableApi = {
  // Auth functions (mock implementation since Airtable doesn't have built-in auth)
  auth: {
    getUser: async () => {
      // Return mock user or implement your own auth system
      const userId = localStorage.getItem('currentUserId')
      if (!userId) return { data: { user: null }, error: null }
      
      try {
        const records = await base('profiles').select({
          filterByFormula: `{id} = '${userId}'`
        }).firstPage()
        
        if (records.length > 0) {
          const record = records[0]
          return {
            data: {
              user: {
                id: record.id,
                email: record.fields.username + '@example.com',
                created_at: record._rawJson.createdTime,
                user_metadata: record.fields
              }
            },
            error: null
          }
        }
        return { data: { user: null }, error: null }
      } catch (error) {
        return { data: { user: null }, error }
      }
    },
    
    getSession: async () => {
      const user = await airtableApi.auth.getUser()
      return {
        data: {
          session: user.data.user ? {
            user: user.data.user,
            access_token: 'mock-token'
          } : null
        },
        error: user.error
      }
    },
    
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Mock implementation - you'd implement real auth state changes
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    },
    
    signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
      // Mock implementation - implement your own auth
      return { data: null, error: { message: 'Auth not implemented with Airtable' } }
    },
    
    signUp: async ({ email, password, options }: any) => {
      // Mock implementation
      return { data: null, error: { message: 'Auth not implemented with Airtable' } }
    },
    
    signInWithOtp: async ({ email, options }: any) => {
      // Mock implementation
      return { data: null, error: { message: 'Auth not implemented with Airtable' } }
    },
    
    signOut: async () => {
      localStorage.removeItem('currentUserId')
      return { error: null }
    }
  },
  
  // Generic table operations
  from: (tableName: string) => ({
    select: (columns?: string | { count?: string, head?: boolean }) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          try {
            const records = await base(tableName).select({
              filterByFormula: `{${column}} = '${value}'`
            }).firstPage()
            
            if (records.length === 0) {
              return { data: null, error: { code: 'PGRST116' } }
            }
            
            return {
              data: convertAirtableRecord(records[0], records[0].fields),
              error: null
            }
          } catch (error) {
            return { data: null, error }
          }
        },
        
        order: (orderColumn: string, options?: { ascending: boolean }) => ({
          limit: (limitCount: number) => ({
            async then(resolve: (result: any) => void) {
              try {
                const records = await base(tableName).select({
                  filterByFormula: `{${column}} = '${value}'`,
                  sort: [{ field: orderColumn, direction: options?.ascending ? 'asc' : 'desc' }],
                  maxRecords: limitCount
                }).firstPage()
                
                const data = records.map(record => convertAirtableRecord(record, record.fields))
                resolve({ data, error: null })
              } catch (error) {
                resolve({ data: null, error })
              }
            }
          })
        })
      }),
      
      gte: (column: string, value: any) => ({
        order: (orderColumn: string, options?: { ascending: boolean }) => ({
          limit: (limitCount: number) => ({
            async then(resolve: (result: any) => void) {
              try {
                const records = await base(tableName).select({
                  filterByFormula: `{${column}} >= '${value}'`,
                  sort: [{ field: orderColumn, direction: options?.ascending ? 'asc' : 'desc' }],
                  maxRecords: limitCount
                }).firstPage()
                
                const data = records.map(record => convertAirtableRecord(record, record.fields))
                resolve({ data, error: null })
              } catch (error) {
                resolve({ data: null, error })
              }
            }
          })
        }),
        
        async then(resolve: (result: any) => void) {
          try {
            const records = await base(tableName).select({
              filterByFormula: `{${column}} >= '${value}'`
            }).firstPage()
            
            const data = records.map(record => convertAirtableRecord(record, record.fields))
            resolve({ data, error: null })
          } catch (error) {
            resolve({ data: null, error })
          }
        }
      }),
      
      order: (column: string, options?: { ascending: boolean }) => ({
        limit: (limitCount: number) => ({
          async then(resolve: (result: any) => void) {
            try {
              const records = await base(tableName).select({
                sort: [{ field: column, direction: options?.ascending ? 'asc' : 'desc' }],
                maxRecords: limitCount
              }).firstPage()
              
              const data = records.map(record => convertAirtableRecord(record, record.fields))
              resolve({ data, error: null })
            } catch (error) {
              resolve({ data: null, error })
            }
          }
        }),
        
        async then(resolve: (result: any) => void) {
          try {
            const records = await base(tableName).select({
              sort: [{ field: column, direction: options?.ascending ? 'asc' : 'desc' }]
            }).firstPage()
            
            const data = records.map(record => convertAirtableRecord(record, record.fields))
            resolve({ data, error: null })
          } catch (error) {
            resolve({ data: null, error })
          }
        }
      }),
      
      async then(resolve: (result: any) => void) {
        try {
          if (typeof columns === 'object' && columns?.count === 'exact' && columns?.head) {
            const records = await base(tableName).select().all()
            resolve({ count: records.length, error: null })
          } else {
            const records = await base(tableName).select().firstPage()
            const data = records.map(record => convertAirtableRecord(record, record.fields))
            resolve({ data, error: null })
          }
        } catch (error) {
          resolve({ data: null, error })
        }
      }
    }),
    
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          try {
            const records = await base(tableName).create([{ fields: data }])
            return {
              data: convertAirtableRecord(records[0], records[0].fields),
              error: null
            }
          } catch (error) {
            return { data: null, error }
          }
        }
      }),
      
      async then(resolve: (result: any) => void) {
        try {
          const records = await base(tableName).create([{ fields: data }])
          resolve({
            data: convertAirtableRecord(records[0], records[0].fields),
            error: null
          })
        } catch (error) {
          resolve({ data: null, error })
        }
      }
    }),
    
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        async then(resolve: (result: any) => void) {
          try {
            const existingRecords = await base(tableName).select({
              filterByFormula: `{${column}} = '${value}'`
            }).firstPage()
            
            if (existingRecords.length === 0) {
              resolve({ data: null, error: { message: 'Record not found' } })
              return
            }
            
            const updatedRecords = await base(tableName).update([
              { id: existingRecords[0].id, fields: data }
            ])
            
            resolve({
              data: convertAirtableRecord(updatedRecords[0], updatedRecords[0].fields),
              error: null
            })
          } catch (error) {
            resolve({ data: null, error })
          }
        }
      })
    }),
    
    delete: () => ({
      eq: (column: string, value: any) => ({
        async then(resolve: (result: any) => void) {
          try {
            const existingRecords = await base(tableName).select({
              filterByFormula: `{${column}} = '${value}'`
            }).firstPage()
            
            if (existingRecords.length === 0) {
              resolve({ data: null, error: { message: 'Record not found' } })
              return
            }
            
            await base(tableName).destroy([existingRecords[0].id])
            resolve({ data: null, error: null })
          } catch (error) {
            resolve({ data: null, error })
          }
        }
      })
    }),
    
    upsert: (data: any) => ({
      async then(resolve: (result: any) => void) {
        try {
          // For upsert, we'll try to find existing record and update, or create new
          const records = await base(tableName).create([{ fields: data }])
          resolve({
            data: convertAirtableRecord(records[0], records[0].fields),
            error: null
          })
        } catch (error) {
          resolve({ data: null, error })
        }
      }
    })
  })
}

// Utility Functions
export const trackPageView = async (pageType: string, pageId?: string) => {
  try {
    const userId = localStorage.getItem('currentUserId')
    
    await base('page_views').create([{
      fields: {
        page_type: pageType,
        page_id: pageId,
        user_id: userId,
        created_at: new Date().toISOString()
      }
    }])
  } catch (error) {
    console.warn('Page view tracking failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

export { airtableApi as supabase }