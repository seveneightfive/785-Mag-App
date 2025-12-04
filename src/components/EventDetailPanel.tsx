import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  ExternalLink,
  Star,
  Heart,
  Share2,
  Music,
  Eye
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArtistCard } from './ArtistCard'
import { ShareModal } from './ShareModal'
import { supabase, type Event, type EventRSVP, trackPageView } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface EventDetailPanelProps {
  eventSlug: string | null
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ eventSlug }) => {
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null)
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, interested: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [pageViews, setPageViews] = useState(0)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  useEffect(() => {
    if (eventSlug) {
      fetchEvent()
    } else {
      setEvent(null)
    }
  }, [eventSlug])

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
    if (!eventSlug) return

    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues(*),
        event_artists(artist:artists(*))
      `)
      .eq('slug', eventSlug)
      .single()

    if (error) {
      console.error('Error fetching event:', error)
      setEvent(null)
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
      .maybeSingle()

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

  if (!eventSlug) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
        <div className="text-center">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Event</h3>
          <p className="text-gray-600">Click on an event from the list to view its details</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
        <div className="text-center">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h3>
          <p className="text-gray-600">The selected event could not be loaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-white rounded-xl shadow-sm">
      <div className="p-6">
        {/* Event Image */}
        {event.image_url && (
          <div className="mb-6 overflow-hidden rounded-xl bg-gray-100">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-auto object-contain"
              style={{ aspectRatio: '1200/1080' }}
            />
          </div>
        )}

        {/* Event Info */}
        <div className="mb-6">
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

          <h1 className="text-2xl font-bold text-gray-900 mb-4 font-urbanist">{event.title}</h1>

          {event.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{event.description}</p>
          )}

          {/* Share Button - Repositioned here */}
          <div className="mb-6">
            <button
              onClick={() => setShareModalOpen(true)}
              className="btn-white flex items-center space-x-2"
            >
              <Share2 size={16} />
              <span>Share Event</span>
            </button>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="flex items-start space-x-3">
              <Calendar className="text-[#FFCE03] mt-1" size={20} />
              <div>
                <p className="font-medium text-gray-900">Date</p>
                <p className="text-gray-600">{formatDate(event.start_date)}</p>
              </div>
            </div>

            {(event.event_start_time || event.event_end_time) && (
              <div className="flex items-start space-x-3">
                <Clock className="text-[#FFCE03] mt-1" size={20} />
                <div>
                  <p className="font-medium text-gray-900">Time</p>
                  <p className="text-gray-600">
                    {event.event_start_time}
                    {event.event_end_time && ` - ${event.event_end_time}`}
                  </p>
                </div>
              </div>
            )}

            {event.venue && (
              <div className="flex items-start space-x-3">
                <MapPin className="text-[#FFCE03] mt-1" size={20} />
                <div>
                  <p className="font-medium text-gray-900">Venue</p>
                  <Link
                    to={`/venues/${event.venue.slug}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {event.venue.name}
                  </Link>
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
              <Eye className="text-[#FFCE03] mt-1" size={20} />
              <div>
                <p className="font-medium text-gray-900">Views</p>
                <p className="text-gray-600">{pageViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* RSVP Section */}
          {user && (
            <div className="mb-6">
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
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Venue Details</h3>
              <div className="space-y-3">
                {event.venue.logo && (
                  <div className="mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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
                
                <Link
                  to={`/venues/${event.venue.slug}`}
                  className="btn-white w-full text-center inline-block"
                >
                  View Venue Details
                </Link>
              </div>
            </div>
          )}

          {/* Featured Artists */}
          {event.event_artists && event.event_artists.length > 0 && (
            <div>
              <h2 className="text-xl font-bold font-urbanist text-gray-900 mb-4">FEATURING</h2>
              <div className="space-y-4">
                {event.event_artists.map(({ artist }) => (
                  <div key={artist.id} className="border border-gray-200 rounded-lg p-4">
                    <Link to={`/artists/${artist.slug}`} className="block">
                      <div className="flex items-center space-x-3">
                        {artist.image_url && (
                          <img
                            src={artist.image_url}
                            alt={artist.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {artist.name}
                          </h3>
                          {artist.artist_type && (
                            <p className="text-sm text-gray-600">{artist.artist_type}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {event && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          title={event.title}
          description={event.description}
          url={`${window.location.origin}/events/${event.slug}`}
          imageUrl={event.image_url}
        />
      )}
    </div>
  )
}