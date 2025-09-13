import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  ExternalLink, 
  ArrowLeft,
  Star,
  Heart,
  Share2,
  Music,
  Palette,
  Eye
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { ArtistCard } from '../components/ArtistCard'
import { supabase, type Event, type EventRSVP, trackPageView } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null)
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, interested: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [pageViews, setPageViews] = useState(0)

  useEffect(() => {
    if (slug) {
      fetchEvent()
    }
  }, [slug])

  useEffect(() => {
    if (event && user) {
      fetchRSVPStatus()
      checkFollowStatus()
    }
    if (event) {
      fetchRSVPCounts()
      fetchPageViews()
      trackPageView('event', event.id)
    }
  }, [event, user])

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues(*),
        event_artists(artist:artists(*))
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching event:', error)
    } else {
      setEvent(data)
    }
    setLoading(false)
  }

  const fetchRSVPStatus = async () => {
    if (!event || !user) return

    const { data } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .single()

    setRsvpStatus(data?.status || null)
  }

  const fetchRSVPCounts = async () => {
    if (!event) return

    const { data } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', event.id)

    const counts = { going: 0, interested: 0 }
    data?.forEach(rsvp => {
      if (rsvp.status === 'going') counts.going++
      if (rsvp.status === 'interested') counts.interested++
    })

    setRsvpCounts(counts)
  }

  const checkFollowStatus = async () => {
    if (!event || !user) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('entity_type', 'event')
      .eq('entity_id', event.id)
      .single()

    setIsFollowing(!!data)
  }

  const fetchPageViews = async () => {
    if (!event) return

    const { count } = await supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .eq('page_type', 'event')
      .eq('page_id', event.id)

    setPageViews(count || 0)
  }

  const handleRSVP = async (status: string) => {
    if (!user || !event) return

    if (rsvpStatus === status) {
      // Remove RSVP
      await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id)
      
      setRsvpStatus(null)
    } else {
      // Add or update RSVP
      await supabase
        .from('event_rsvps')
        .upsert({
          event_id: event.id,
          user_id: user.id,
          status
        })
      
      setRsvpStatus(status)
    }

    fetchRSVPCounts()
  }

  const handleFollow = async () => {
    if (!user || !event) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('entity_type', 'event')
          .eq('entity_id', event.id)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            entity_type: 'event',
            entity_id: event.id
          })
      }
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('Error following event:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Art': 'bg-purple-600 text-white',
      'Entertainment': 'bg-pink-600 text-white',
      'Lifestyle': 'bg-green-600 text-white',
      'Local Flavor': 'bg-orange-600 text-white',
      'Live Music': 'bg-blue-600 text-white',
      'Party For A Cause': 'bg-red-600 text-white',
      'Community / Cultural': 'bg-indigo-600 text-white',
      'Shop Local': 'bg-yellow-600 text-white'
    }
    return colors[type] || 'bg-gray-600 text-white'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!event) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <button
              onClick={() => navigate('/events')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Events
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">

        {/* Mobile Hero Image - Full Width */}
        <div className="lg:hidden w-full">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Calendar size={64} className="text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/events')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Events
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Desktop Event Image */}
              {event.image_url && (
                <div className="hidden lg:block mb-8">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-64 md:h-80 object-cover rounded-xl"
                  />
                </div>
              )}

              {/* Event Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.event_types?.map((type) => (
                    <span
                      key={type}
                      className={`px-3 py-1 rounded-full text-sm font-bold ${getEventTypeColor(type)}`}
                    >
                      {type}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4 font-oswald">{event.title}</h1>

                {event.description && (
                  <p className="text-gray-600 mb-6 leading-relaxed">{event.description}</p>
                )}

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <Calendar className="text-[#FFCE03] lg:text-blue-600 mt-1" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Date</p>
                      <p className="text-gray-600">{formatDate(event.start_date)}</p>
                    </div>
                  </div>

                  {(event.event_start_time || event.event_end_time) && (
                    <div className="flex items-start space-x-3">
                      <Clock className="text-[#FFCE03] lg:text-blue-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">Time</p>
                        <p className="text-gray-600">
                          {event.event_start_time}
                          {event.event_end_time && ` - ${event.event_end_time}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {event.capacity && (
                    <div className="flex items-start space-x-3">
                      <Users className="text-blue-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">Capacity</p>
                        <p className="text-gray-600">{event.capacity} people</p>
                      </div>
                    </div>
                  )}

                  {event.ticket_price && (
                    <div className="flex items-start space-x-3">
                      <DollarSign className="text-blue-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">Price</p>
                        <p className="text-gray-600">${event.ticket_price}</p>
                      </div>
                    </div>
                  )}

                  {event.ticket_url && (
                    <div className="flex items-start space-x-3">
                      <ExternalLink className="text-blue-600 mt-1" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">Tickets</p>
                        <a
                          href={event.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Get Tickets
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Eye className="text-[#FFCE03] lg:text-blue-600 mt-1" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Views</p>
                      <p className="text-gray-600">{pageViews.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Artists */}
              {event.event_artists && event.event_artists.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                  <h2 className="text-xl font-bold font-oswald text-gray-900 mb-4">FEATURING</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {event.event_artists.map(({ artist }) => (
                      <ArtistCard key={artist.id} artist={artist} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* RSVP Section */}
              {user && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">RSVP</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleRSVP('going')}
                      className={`w-full flex items-center justify-center space-x-2 transition-colors ${
                        rsvpStatus === 'going'
                          ? 'btn-pink'
                          : 'btn-filter'
                      }`}
                    >
                      <Heart size={16} />
                      <span>Going ({rsvpCounts.going})</span>
                    </button>
                    <button
                      onClick={() => handleRSVP('interested')}
                      className={`w-full flex items-center justify-center space-x-2 transition-colors ${
                        rsvpStatus === 'interested'
                          ? 'btn-yellow'
                          : 'btn-filter'
                      }`}
                    >
                      <Star size={16} />
                      <span>Interested ({rsvpCounts.interested})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Venue Details */}
              {event.venue && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="space-y-3">
                    {/* Venue Logo */}
                    {event.venue.logo && (
                      <div className="mb-4">
                        <div className="w-[150px] h-[150px] rounded-full overflow-hidden bg-gray-100 flex items-center justify-center object-contain">
                          <img
                            src={event.venue.logo}
                            alt={`${event.venue.name} logo`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900">{event.venue.name}</h4>
                      <p className="text-gray-600 text-sm">{event.venue.address}</p>
                      {event.venue.city !== 'Topeka' && (
                        <p className="text-gray-600 text-sm">
                          {event.venue.city}, {event.venue.state}
                        </p>
                      )}
                    </div>
                    
                    {event.venue.phone && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900">{event.venue.phone}</p>
                      </div>
                    )}
                    
                    {event.venue.website && (
                      <div>
                        <a
                          href={event.venue.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Visit Website →
                        </a>
                      </div>
                    )}
                    
                    <button
                      onClick={() => navigate(`/venues/${event.venue?.slug}`)}
                      className="btn-white w-full"
                    >
                      View Venue Details
                    </button>
                  </div>
                </div>
              )}

              {/* Share Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: event.title,
                        text: event.description,
                        url: window.location.href
                      }).catch((error) => {
                        // Only log non-user-cancellation errors
                        if (error.name !== 'NotAllowedError') {
                          console.error('Error sharing:', error)
                        }
                        // Fallback to clipboard copy on any error
                        navigator.clipboard.writeText(window.location.href)
                      })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                    }
                  }}
                  className="btn-white w-full flex items-center justify-center space-x-2"
                >
                  <Share2 size={16} />
                  <span>Share Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}