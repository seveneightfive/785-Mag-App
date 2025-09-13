import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Star, Music, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { EventCard } from '../components/EventCard'
import { ArtistCard } from '../components/ArtistCard'
import { VenueCard } from '../components/VenueCard'
import { MenuProcCard } from '../components/MenuProcCard'
import { MenuProcModal } from '../components/MenuProcModal'
import { AnimatedStats } from '../components/AnimatedStats'
import { AnnouncementBanner } from '../components/AnnouncementBanner'
import { AdvertisementBanner } from '../components/AdvertisementBanner'
import { supabase, type Event, type Artist, type Venue, type MenuProc, trackPageView } from '../lib/supabase'

export const HomePage: React.FC = () => {
  const [starredEvents, setStarredEvents] = useState<Event[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([])
  const [featuredVenues, setFeaturedVenues] = useState<Venue[]>([])
  const [latestMenuProcs, setLatestMenuProcs] = useState<MenuProc[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedMenuProc, setSelectedMenuProc] = useState<MenuProc | null>(null)
  const [showMenuProcModal, setShowMenuProcModal] = useState(false)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalArtists: 0,
    totalVenues: 0
  })

  useEffect(() => {
    trackPageView('home')
    fetchHomeData()
  }, [])

  useEffect(() => {
    if (starredEvents.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % starredEvents.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [starredEvents.length])

  const fetchHomeData = async () => {
    try {
      // Get current date in local timezone, start of today
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // Fetch starred events
      const { data: starredData } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          event_artists(artist:artists(*))
        `)
        .eq('star', true)
        .gte('start_date', today.toISOString())
        .order('start_date', { ascending: true })
        .limit(5)

      if (starredData) {
        setStarredEvents(starredData)
      }

      // Fetch upcoming events (non-starred)
      const { data: upcomingData } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          event_artists(artist:artists(*))
        `)
        .neq('star', true)
        .gte('start_date', today.toISOString())
        .order('start_date', { ascending: true })
        .limit(6)

      if (upcomingData) {
        setUpcomingEvents(upcomingData)
      }

      // Fetch featured artists (verified ones)
      const { data: artistsData } = await supabase
        .from('artists')
        .select('*')
        .not('avatar_url', 'is', null)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6)

      if (artistsData) {
        setFeaturedArtists(artistsData)
      }

      // Fetch featured venues (random selection)
      const { data: venuesData } = await supabase
        .from('venues')
        .select('*')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6)

      if (venuesData) {
        setFeaturedVenues(venuesData)
      }

      // Fetch latest menu procs
      const { data: menuProcsData } = await supabase
        .from('menu_procs')
        .select(`
          *,
          venue:venues(*),
          user:profiles(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (menuProcsData) {
        setLatestMenuProcs(menuProcsData)
      }

      // Fetch total counts for stats
      const [eventsCount, artistsCount, venuesCount] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('artists').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true })
      ])

      setStats({
        totalEvents: eventsCount.count || 0,
        totalArtists: artistsCount.count || 0,
        totalVenues: venuesCount.count || 0
      })

    } catch (error) {
      console.error('Error fetching home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % starredEvents.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + starredEvents.length) % starredEvents.length)
  }

  const handleMenuProcClick = (menuProc: MenuProc) => {
    setSelectedMenuProc(menuProc)
    setShowMenuProcModal(true)
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Announcement Banner */}
        <AnnouncementBanner />
        
        {/* Hero Section with Starred Events Slider */}
        {starredEvents.length > 0 && (
          <section 
            className="relative h-[60vh] lg:h-[70vh] overflow-hidden"
            onTouchStart={(e) => {
              const touch = e.touches[0]
              const startX = touch.clientX
              const handleTouchMove = (moveEvent: TouchEvent) => {
                const currentX = moveEvent.touches[0].clientX
                const diff = startX - currentX
                if (Math.abs(diff) > 50) {
                  if (diff > 0) {
                    nextSlide()
                  } else {
                    prevSlide()
                  }
                  document.removeEventListener('touchmove', handleTouchMove)
                  document.removeEventListener('touchend', handleTouchEnd)
                }
              }
              const handleTouchEnd = () => {
                document.removeEventListener('touchmove', handleTouchMove)
                document.removeEventListener('touchend', handleTouchEnd)
              }
              document.addEventListener('touchmove', handleTouchMove)
              document.addEventListener('touchend', handleTouchEnd)
            }}
          >
            <div className="relative w-full h-full">
              {starredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Calendar size={120} className="text-white opacity-50" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
                    <div className="max-w-7xl mx-auto">
                      <div className="flex items-center mb-4">
                        <Star size={24} className="text-yellow-400 fill-current mr-3" />
                        <span className="text-yellow-400 font-medium">Featured Event</span>
                      </div>
                      
                      <h1 className="text-3xl lg:text-6xl font-bold font-oswald text-white mb-4 drop-shadow-lg uppercase">
                        {event.title.toUpperCase()}
                      </h1>
                      
                      <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8 space-y-2 lg:space-y-0 text-white/90 mb-6">
                        <div className="flex items-center">
                          <Calendar size={20} className="mr-2" />
                          <span className="font-medium">
                            {new Date(event.start_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        {event.venue && (
                          <div className="flex items-center">
                            <MapPin size={20} className="mr-2" />
                            <span>{event.venue.name}</span>
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/events/${starredEvents[currentSlide]?.slug}`}
                        className="btn-white inline-block"
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Dots Indicator */}
            {starredEvents.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {starredEvents.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Animated Stats Section */}
        <AnimatedStats 
          eventCount={stats.totalEvents}
          artistCount={stats.totalArtists}
          venueCount={stats.totalVenues}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Latest Menu Procs Section */}
          {latestMenuProcs.length > 0 && (
            <section className="mb-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold font-oswald text-gray-900">
                  Latest Menu Procs
                </h2>
                <Link
                  to="/feed"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  See All →
                </Link>
              </div>
              
              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-3 gap-6">
                {latestMenuProcs.slice(0, 3).map((menuProc) => (
                  <MenuProcCard
                    key={menuProc.id}
                    menuProc={menuProc}
                    onClick={() => handleMenuProcClick(menuProc)}
                    showVenue={true}
                  />
                ))}
              </div>
              
              {/* Mobile Horizontal Scroll */}
              <div className="lg:hidden overflow-x-auto">
                <div className="flex space-x-4 pb-4">
                  {latestMenuProcs.map((menuProc) => (
                    <div key={menuProc.id} className="flex-shrink-0 w-64">
                      <MenuProcCard
                        menuProc={menuProc}
                        onClick={() => handleMenuProcClick(menuProc)}
                        showVenue={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <section className="mb-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold font-oswald text-gray-900">
                  Upcoming Events
                </h2>
                <Link
                  to="/events"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Events →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Featured Artists Section */}
          {featuredArtists.length > 0 && (
            <section className="mb-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold font-oswald text-gray-900">
                  Featured Artists
                </h2>
                <Link
                  to="/artists"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Discover More Artists →
                </Link>
              </div>
              
              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-3 gap-6">
                {featuredArtists.slice(0, 3).map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
              
              {/* Mobile Horizontal Scroll */}
              <div className="lg:hidden overflow-x-auto">
                <div className="flex space-x-4 pb-4">
                  {featuredArtists.map((artist) => (
                    <div key={artist.id} className="flex-shrink-0 w-64">
                      <ArtistCard artist={artist} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Featured Venues Section */}
          {featuredVenues.length > 0 && (
            <section className="mb-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold font-oswald text-gray-900">
                  Featured Venues
                </h2>
                <Link
                  to="/venues"
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  Explore More Venues →
                </Link>
              </div>
              
              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-3 gap-6">
                {featuredVenues.slice(0, 3).map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
              
              {/* Mobile Horizontal Scroll */}
              <div className="lg:hidden overflow-x-auto">
                <div className="flex space-x-4 pb-4">
                  {featuredVenues.map((venue) => (
                    <div key={venue.id} className="flex-shrink-0 w-64">
                      <VenueCard venue={venue} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Advertisement Section */}
          <AdvertisementBanner />
        </div>
      </div>
        <MenuProcModal
          menuProc={selectedMenuProc}
          isOpen={showMenuProcModal}
          onClose={() => {
            setShowMenuProcModal(false)
            setSelectedMenuProc(null)
          }}
        />
    </Layout>
  )
}