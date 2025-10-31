import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateRoutes() {
  console.log('Fetching dynamic routes from Supabase...')

  const staticRoutes = [
    '/',
    '/dashboard',
    '/profile',
    '/feed',
    '/events',
    '/agenda',
    '/artists',
    '/venues',
  ]

  const dynamicRoutes: string[] = []

  try {
    const { data: events } = await supabase
      .from('events')
      .select('slug')
      .eq('status', 'approved')
      .limit(500)

    if (events) {
      events.forEach(event => {
        dynamicRoutes.push(`/events/${event.slug}`)
      })
      console.log(`✓ Added ${events.length} event routes`)
    }

    const { data: artists } = await supabase
      .from('artists')
      .select('slug')
      .eq('status', 'approved')
      .limit(500)

    if (artists) {
      artists.forEach(artist => {
        dynamicRoutes.push(`/artists/${artist.slug}`)
      })
      console.log(`✓ Added ${artists.length} artist routes`)
    }

    const { data: venues } = await supabase
      .from('venues')
      .select('slug')
      .eq('status', 'approved')
      .limit(500)

    if (venues) {
      venues.forEach(venue => {
        dynamicRoutes.push(`/venues/${venue.slug}`)
      })
      console.log(`✓ Added ${venues.length} venue routes`)
    }

    const allRoutes = [...staticRoutes, ...dynamicRoutes]

    const routesDir = path.resolve(process.cwd(), 'dist')
    if (!fs.existsSync(routesDir)) {
      fs.mkdirSync(routesDir, { recursive: true })
    }

    const routesPath = path.resolve(routesDir, 'routes.json')
    fs.writeFileSync(routesPath, JSON.stringify(allRoutes, null, 2))

    console.log(`\n✓ Generated ${allRoutes.length} total routes`)
    console.log(`✓ Routes file created at: ${routesPath}`)

    return allRoutes
  } catch (error) {
    console.error('Error generating routes:', error)
    return staticRoutes
  }
}

generateRoutes()
