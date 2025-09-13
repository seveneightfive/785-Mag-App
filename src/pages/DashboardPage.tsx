import React, { useState, useEffect } from 'react'
import { Calendar, Music, MapPin, Heart, Users, TrendingUp, Clock, Star, X, Eye, Megaphone, Plus, ThumbsUp, DollarSign, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { EventCard } from '../components/EventCard'
import { ArtistCard } from '../components/ArtistCard'
import { VenueCard } from '../components/VenueCard'
import { AnnouncementForm } from '../components/AnnouncementForm'
import { AdvertisementForm } from '../components/AdvertisementForm'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Event, type Artist, type Venue, type Follow, type EventRSVP, type Announcement, type Advertisement, trackPageView } from '../lib/supabase'

interface DashboardModal {
  type: 'artists' | 'venues' | 'rsvps' | 'interested' | 'upcoming' | 'announcements' | 'advertisements' | null
  isOpen: boolean
}

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth()
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([])
  const [followedVenues, setFollowedVenues] = useState<Venue[]>([])
  const [rsvpEvents, setRsvpEvents] = useState<Event[]>([])
  const [interestedEvents, setInterestedEvents] = useState<Event[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [userAnnouncements, setUserAnnouncements] = useState<(Announcement & { reaction_count: number })[]>([])
  const [userAdvertisements, setUserAdvertisements] = useState<Advertisement[]>([])
  const [stats, setStats] = useState({
    followedArtists: 0,
    followedVenues: 0,
    rsvpEvents: 0,
    interestedEvents: 0,
    upcomingEvents: 0,
    announcements: 0,
    advertisements: 0,
    totalAdSpend: 0
  })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<DashboardModal>({ type: null, isOpen: false })
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [showAdvertisementForm, setShowAdvertisementForm] = useState(false)

  useEffect(() => {
    trackPageView('dashboard')
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Fetch followed artists
      const { data: artistFollows } = await supabase
        .from('follows')
        .select(`
          *,
          artist:artists(*)
        `)
        .eq('follower_id', user.id)
        .eq('entity_type', 'artist')

      if (artistFollows) {
        const artists = artistFollows.map(follow => follow.artist).filter(Boolean)
        setFollowedArtists(artists)
      }

      // Fetch followed venues
      const { data: venueFollows } = await supabase
        .from('follows')
        .select(`
          *,
          venue:venues(*)
        `)
        .eq('follower_id', user.id)
        .eq('entity_type', 'venue')

      if (venueFollows) {
        const venues = venueFollows.map(follow => follow.venue).filter(Boolean)
        setFollowedVenues(venues)
      }

      // Fetch RSVP events
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          event:events(
            *,
            venue:venues(*),
            event_artists(artist:artists(*))
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'going')
        .gte('event.start_date', new Date().toISOString())

      if (rsvps) {
        const events = rsvps.map(rsvp => rsvp.event).filter(Boolean)
        setRsvpEvents(events)
      }

      // Fetch interested events
      const { data: interestedRsvps } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          event:events(
            *,
            venue:venues(*),
            event_artists(artist:artists(*))
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'interested')
        .gte('event.start_date', new Date().toISOString())

      if (interestedRsvps) {
        const events = interestedRsvps.map(rsvp => rsvp.event).filter(Boolean)
        setInterestedEvents(events)
      }

      // Fetch upcoming events from followed artists and venues
      const artistIds = artistFollows?.map(f => f.entity_id) || []
      const venueIds = venueFollows?.map(f => f.entity_id) || []

      let upcomingEventsData: Event[] = []

      // Get events from followed venues
      if (venueIds.length > 0) {
        const { data: venueEvents } = await supabase
          .from('events')
          .select(`
            *,
            venue:venues(*),
            event_artists(artist:artists(*))
          `)
          .in('venue_id', venueIds)
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })

        if (venueEvents) {
          upcomingEventsData = [...upcomingEventsData, ...venueEvents]
        }
      }

      // Get events from followed artists
      if (artistIds.length > 0) {
        const { data: artistEvents } = await supabase
          .from('events')
          .select(`
            *,
            venue:venues(*),
            event_artists!inner(artist:artists(*))
          `)
          .in('event_artists.artist_id', artistIds)
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })

        if (artistEvents) {
          // Remove duplicates and merge
          const existingEventIds = new Set(upcomingEventsData.map(e => e.id))
          const newEvents = artistEvents.filter(e => !existingEventIds.has(e.id))
          upcomingEventsData = [...upcomingEventsData, ...newEvents]
        }
      }

      // Sort by date
      upcomingEventsData.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      setUpcomingEvents(upcomingEventsData)

      // Fetch user's announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select(`
          *,
          announcement_reactions(reaction_type, user_id)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (announcementsData) {
        const announcementsWithCounts = announcementsData.map(announcement => ({
          ...announcement,
          thumbs_up: announcement.announcement_reactions?.filter(r => r.reaction_type === 'thumbs_up').length || 0,
          thumbs_down: announcement.announcement_reactions?.filter(r => r.reaction_type === 'heart').length || 0
        }))
        setUserAnnouncements(announcementsWithCounts)
      }

      // Fetch user's advertisements
      const { data: advertisementsData } = await supabase
        .from('advertisements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (advertisementsData) {
        setUserAdvertisements(advertisementsData)
      }

      // Update stats
      const totalAdSpend = advertisementsData?.reduce((sum, ad) => sum + ad.price, 0) || 0
      setStats({
        followedArtists: artistFollows?.length || 0,
        followedVenues: venueFollows?.length || 0,
        rsvpEvents: rsvps?.length || 0,
        interestedEvents: interestedRsvps?.length || 0,
        upcomingEvents: upcomingEventsData.length,
        announcements: announcementsData?.length || 0,
        advertisements: advertisementsData?.length || 0,
        totalAdSpend: totalAdSpend
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (type: 'artists' | 'venues' | 'rsvps' | 'interested' | 'upcoming') => {
    setModal({ type, isOpen: true })
  }

  const openAnnouncementsModal = () => {
    setModal({ type: 'announcements', isOpen: true })
  }

  const openAdvertisementsModal = () => {
    setModal({ type: 'advertisements', isOpen: true })
  }

  const closeModal = () => {
    setModal({ type: null, isOpen: false })
  }

  const renderModalContent = () => {
    switch (modal.type) {
      case 'artists':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Following Artists ({stats.followedArtists})</h3>
            {followedArtists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {followedArtists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Music size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">You're not following any artists yet.</p>
                <Link to="/artists" className="btn-pink mt-4 inline-block">
                  Discover Artists
                </Link>
              </div>
            )}
          </div>
        )
      
      case 'venues':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Following Venues ({stats.followedVenues})</h3>
            {followedVenues.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {followedVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">You're not following any venues yet.</p>
                <Link to="/venues" className="btn-yellow mt-4 inline-block">
                  Discover Venues
                </Link>
              </div>
            )}
          </div>
        )
      
      case 'rsvps':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Your RSVPs ({stats.rsvpEvents})</h3>
            {rsvpEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {rsvpEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">You haven't RSVP'd to any events yet.</p>
                <Link to="/events" className="btn-pink mt-4 inline-block">
                  Browse Events
                </Link>
              </div>
            )}
          </div>
        )
      
      case 'interested':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Interested Events ({stats.interestedEvents})</h3>
            {interestedEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {interestedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">You haven't marked any events as interesting yet.</p>
                <Link to="/events" className="btn-yellow mt-4 inline-block">
                  Browse Events
                </Link>
              </div>
            )}
          </div>
        )
      
      case 'upcoming':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Upcoming Events ({stats.upcomingEvents})</h3>
            <p className="text-sm text-gray-600">Events from artists and venues you follow</p>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No upcoming events from your followed artists and venues.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                  <Link to="/artists" className="btn-pink">
                    Follow Artists
                  </Link>
                  <Link to="/venues" className="btn-yellow">
                    Follow Venues
                  </Link>
                </div>
              </div>
            )}
          </div>
        )
      
      case 'announcements':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Your Announcements ({stats.announcements})</h3>
              <button
                onClick={() => {
                  closeModal()
                  setShowAnnouncementForm(true)
                }}
                className="btn-pink flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>New</span>
              </button>
            </div>
            {userAnnouncements.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {userAnnouncements.map((announcement) => {
                  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()
                  const expiresAt = announcement.expires_at ? new Date(announcement.expires_at) : null
                  
                  return (
                    <div key={announcement.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <span className="text-red-600">👎</span>
                              <span>{announcement.thumbs_down || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-green-600">👍</span>
                              <span>{announcement.thumbs_up || 0}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isExpired 
                              ? 'bg-red-100 text-red-800' 
                              : announcement.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isExpired ? 'Expired' : announcement.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{announcement.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {new Date(announcement.created_at).toLocaleDateString()}</span>
                        {expiresAt && (
                          <span>Expires: {expiresAt.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Megaphone size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">You haven't created any announcements yet.</p>
                <button
                  onClick={() => {
                    closeModal()
                    setShowAnnouncementForm(true)
                  }}
                  className="btn-pink"
                >
                  Create Your First Announcement
                </button>
              </div>
            )}
          </div>
        )
      
      case 'advertisements':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Your Advertisements ({stats.advertisements})</h3>
                <p className="text-sm text-gray-600">Total Spend: ${(stats.totalAdSpend / 100).toFixed(2)}</p>
              </div>
              <button
                onClick={() => {
                  closeModal()
                  setShowAdvertisementForm(true)
                }}
                className="btn-yellow flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>New Ad</span>
              </button>
            </div>
            {userAdvertisements.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {userAdvertisements.map((ad) => {
                  const isActive = new Date(ad.start_date) <= new Date() && new Date(ad.end_date) >= new Date()
                  const isExpired = new Date(ad.end_date) < new Date()
                  const isPending = new Date(ad.start_date) > new Date()
                  
                  return (
                    <div key={ad.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{ad.title}</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Eye size={14} />
                            <span>{ad.views}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <ExternalLink size={14} />
                            <span>{ad.clicks}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isActive 
                              ? 'bg-green-100 text-green-800' 
                              : isExpired
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isActive ? 'Active' : isExpired ? 'Expired' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{ad.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}
                        </span>
                        <span>${(ad.price / 100).toFixed(2)} ({ad.duration} days)</span>
                      </div>
                      {ad.clicks > 0 && ad.views > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          CTR: {((ad.clicks / ad.views) * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">You haven't created any advertisements yet.</p>
                <button
                  onClick={() => {
                    closeModal()
                    setShowAdvertisementForm(true)
                  }}
                  className="btn-yellow"
                >
                  Create Your First Ad
                </button>
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
            <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
          </div>
        </div>
      </Layout>
    )
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
        {/* Header Banner */}
        <div className="bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl lg:text-4xl font-bold font-oswald mb-2">DASHBOARD</h1>
            <p className="text-lg text-white/90">
              Welcome back, {profile?.full_name || profile?.username || 'User'}!
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 lg:gap-6 mb-8">
            <button
              onClick={() => openModal('artists')}
              className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Music className="text-purple-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.followedArtists}</p>
                  <p className="text-sm text-gray-600">Artists</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => openModal('venues')}
              className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center">
                <div className="bg-teal-100 p-3 rounded-lg group-hover:bg-teal-200 transition-colors">
                  <MapPin className="text-teal-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.followedVenues}</p>
                  <p className="text-sm text-gray-600">Venues</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => openModal('rsvps')}
              className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Calendar className="text-green-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.rsvpEvents}</p>
                  <p className="text-sm text-gray-600">RSVPs</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => openModal('interested')}
              className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <Star className="text-yellow-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.interestedEvents}</p>
                  <p className="text-sm text-gray-600">Interested</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => openModal('upcoming')}
              className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <TrendingUp className="text-blue-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                  <p className="text-sm text-gray-600">Upcoming</p>
                </div>
              </div>
            </button>

            <button
              onClick={openAnnouncementsModal}
              className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Megaphone className="text-orange-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.announcements}</p>
                  <p className="text-sm text-gray-600">Announcements</p>
                </div>
              </div>
            </button>

            <button
              onClick={openAdvertisementsModal}
              className="bg-white rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <DollarSign className="text-yellow-600" size={20} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.advertisements}</p>
                  <p className="text-sm text-gray-600">Ads</p>
                </div>
              </div>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Link
                to="/events"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Calendar className="text-blue-600 mr-3" size={20} />
                <span className="font-medium text-gray-900">Browse Events</span>
              </Link>
              <Link
                to="/artists"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Music className="text-purple-600 mr-3" size={20} />
                <span className="font-medium text-gray-900">Discover Artists</span>
              </Link>
              <Link
                to="/venues"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MapPin className="text-teal-600 mr-3" size={20} />
                <span className="font-medium text-gray-900">Find Venues</span>
              </Link>
              <button
                onClick={() => setShowAnnouncementForm(true)}
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Megaphone className="text-orange-600 mr-3" size={20} />
                <span className="font-medium text-gray-900">Create Announcement</span>
              </button>
              <button
                onClick={() => setShowAdvertisementForm(true)}
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <DollarSign className="text-yellow-600 mr-3" size={20} />
                <span className="font-medium text-gray-900">Create Advertisement</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          {stats.followedArtists === 0 && stats.followedVenues === 0 && stats.rsvpEvents === 0 && stats.interestedEvents === 0 && stats.announcements === 0 && stats.advertisements === 0 && (
            <div className="text-center py-12 mt-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <Heart size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Building Your Network</h3>
                <p className="text-gray-600 mb-6">
                  Follow your favorite artists and venues to get personalized recommendations and never miss an event.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    to="/artists"
                    className="btn-pink"
                  >
                    Discover Artists
                  </Link>
                  <Link
                    to="/venues"
                    className="btn-yellow"
                  >
                    Find Venues
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {modal.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex-1">
                  {renderModalContent()}
                </div>
                <button
                  onClick={closeModal}
                  className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        <AnnouncementForm
          isOpen={showAnnouncementForm}
          onClose={() => setShowAnnouncementForm(false)}
          onSuccess={() => {
            fetchDashboardData()
          }}
        />

        <AdvertisementForm
          isOpen={showAdvertisementForm}
          onClose={() => setShowAdvertisementForm(false)}
          onSuccess={() => {
            fetchDashboardData()
          }}
        />
      </div>
    </Layout>
  )
}