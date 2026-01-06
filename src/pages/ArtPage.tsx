import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Building2, ChevronRight } from 'lucide-react'
import { Layout } from '../components/Layout'
import { EventCard } from '../components/EventCard'
import { ArtistCard } from '../components/ArtistCard'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { supabase, type Event, type Artist, type Announcement, trackPageView } from '../lib/supabase'

export const ArtPage: React.FC = () => {
  const [exhibitions, setExhibitions] = useState<Event[]>([])
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [stats, setStats] = useState({ totalArtists: 0, totalVenues: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackPageView('art')
    fetchArtPageData()
  }, [])

  const fetchArtPageData = async () => {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Fetch exhibitions
      const { data: exhibitionsData } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          event_artists(artist:artists(*))
        `)
        .contains('event_types', ['Exhibition'])
        .gte('start_date', today.toISOString())
        .order('start_date', { ascending: true })
        .limit(5)

      if (exhibitionsData) {
        setExhibitions(exhibitionsData)
      }

      // Fetch featured artists (with work images)
      const { data: artistsData } = await supabase
        .from('artists')
        .select('*')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(4)

      if (artistsData) {
        setFeaturedArtists(artistsData)
      }

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)

      if (announcementsData) {
        setAnnouncements(announcementsData)
      }

      // Fetch stats
      const { count: artistCount } = await supabase
        .from('artists')
        .select('id', { count: 'exact', head: true })

      const { count: venueCount } = await supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('venue_type', 'Gallery / Museum')

      setStats({
        totalArtists: artistCount || 0,
        totalVenues: venueCount || 0
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching art page data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Featured Exhibitions */}
        {exhibitions.length > 0 && (
          <div className="relative h-[50vh] overflow-hidden bg-black">
            {exhibitions[0].image_url ? (
              <img
                src={exhibitions[0].image_url}
                alt={exhibitions[0].title}
                className="w-full h-full object-cover opacity-50"
              />
            ) : null}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-5xl lg:text-6xl font-oswald font-bold text-white mb-4">
                  {exhibitions[0].title.toUpperCase()}
                </h2>
                {exhibitions[0].description && (
                  <p className="text-xl text-white/90 mb-6 max-w-2xl">{exhibitions[0].description}</p>
                )}
                <Link
                  to={`/events/${exhibitions[0].slug}`}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Explore Exhibition
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
          {/* Featured Artists Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-oswald font-bold text-gray-900 mb-3">
                FEATURED ARTISTS
              </h2>
              <p className="text-lg text-gray-600">
                Discover the visionaries shaping Topeka's creative landscape.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredArtists.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/artists/${artist.slug}`}
                  className="block group cursor-pointer"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    {/* Artist Work Image */}
                    <div className="aspect-square overflow-hidden bg-gray-200">
                      {artist.image_url ? (
                        <img
                          src={artist.image_url}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Artist Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-oswald font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {artist.name.toUpperCase()}
                      </h3>
                      {artist.artist_type && (
                        <p className="text-sm text-gray-600 mt-1">{artist.artist_type}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Explore Artist Directory CTA Section */}
          <section className="mb-20 bg-black rounded-xl p-16 text-center text-white">
            <h2 className="text-4xl lg:text-5xl font-oswald font-bold mb-4">
              EXPLORE THE ARTIST DIRECTORY
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Find your next favorite artist
            </p>
            <Link
              to="/artists"
              className="inline-block bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200 transition-colors"
            >
              Browse Artists
            </Link>
          </section>

          {/* Community Feed Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-oswald font-bold text-gray-900 mb-3">
                COMMUNITY FEED
              </h2>
              <p className="text-lg text-gray-600">
                Latest announcements, forum highlights, and art opportunities.
              </p>
            </div>

            {announcements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-600">No announcements at this time.</p>
              </div>
            )}
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            <div className="bg-gray-800 rounded-xl p-8 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-5xl font-bold mb-2">{stats.totalArtists}+</div>
                  <h3 className="text-xl font-semibold">Local Artists</h3>
                </div>
                <Users size={40} className="opacity-50" />
              </div>
              <p className="text-gray-300">Showcasing excellence across disciplines.</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-8 text-white border-l-4 border-orange-500">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-5xl font-bold mb-2">{stats.totalVenues}+</div>
                  <h3 className="text-xl font-semibold">Partner Galleries</h3>
                </div>
                <Building2 size={40} className="opacity-50" />
              </div>
              <p className="text-gray-300">Showcasing excellence across Topeka.</p>
            </div>
          </section>

          {/* CTA Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-xl overflow-hidden">
            {/* For Artists */}
            <div className="bg-orange-600 text-white p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="text-4xl font-oswald font-bold mb-4">FOR ARTISTS</h2>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                Showcase your portfolio, connect with local galleries, and sell your work to dedicated collectors.
              </p>
              <Link
                to="/register?type=artist"
                className="inline-flex items-center bg-white text-orange-600 px-8 py-3 rounded font-bold hover:bg-gray-100 transition-colors w-fit"
              >
                Join as Artist
                <ChevronRight size={20} className="ml-2" />
              </Link>
            </div>

            {/* For Collectors */}
            <div className="bg-yellow-500 text-black p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="text-4xl font-oswald font-bold mb-4">FOR COLLECTORS</h2>
              <p className="text-lg text-black/80 mb-8 leading-relaxed">
                Discover exclusive works, track your favorite artists, and stay updated on the latest exhibitions and gallery openings.
              </p>
              <Link
                to="/register?type=collector"
                className="inline-flex items-center bg-black text-yellow-500 px-8 py-3 rounded font-bold hover:bg-gray-800 transition-colors w-fit"
              >
                Coming Soon
                <ChevronRight size={20} className="ml-2" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  )
}
