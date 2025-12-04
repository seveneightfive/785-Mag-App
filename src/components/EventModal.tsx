import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  ExternalLink,
  Star,
  Heart,
  Share2,
  Eye
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, type Event, trackPageView } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ShareModal } from './ShareModal'

interface EventModalProps {
  eventSlug: string | null
  isOpen: boolean
  onClose: () => void
}

export const EventModal: React.FC<EventModalProps> = ({ eventSlug, isOpen, onClose }) => {
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null)
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, interested: 0 })
  const [pageViews, setPageViews] = useState(0)
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen && eventSlug) {
      fetchEvent()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, eventSlug])

  useEffect(() => {
    if (event && user) {
      fetchRSVPStatus()
    }
    if (event) {
      fetchRSVPCounts()
      fetchPageViews()
      trackPageView('event', event.id)
    }
  }, [event, user])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

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
      .maybeSingle()

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
      await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id)

      setRsvpStatus(null)
    } else {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-0 md:p-4">
        <div
          className="relative bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : !event ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h3>
                  <p className="text-gray-600">The selected event could not be loaded</p>
                </div>
              </div>
            ) : (
              <>
                {event.image_url && (
                  <div className="w-full overflow-hidden bg-gray-100">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-auto object-contain"
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement
                        const ratio = img.naturalWidth / img.naturalHeight
                        setImageAspectRatio(ratio)
                      }}
                      style={{
                        maxHeight: imageAspectRatio && imageAspectRatio < 1 ? '70vh' : 'none'
                      }}
                    />
                  </div>
                )}

                <div className="p-4 sm:p-6 md:p-8">
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

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-urbanist">
                    {event.title}
                  </h1>

                  {event.description && (
                    <p className="text-gray-600 mb-6 leading-relaxed">{event.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    <div className="space-y-4">
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
                              onClick={onClose}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {event.venue.name}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
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
                  </div>

                  {user && (
                    <div className="mb-6 border-t border-gray-200 pt-6">
                      <h3 className="font-bold text-gray-900 mb-4">RSVP</h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleRSVP('going')}
                          className={`flex-1 flex items-center justify-center space-x-2 transition-colors ${
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
                          className={`flex-1 flex items-center justify-center space-x-2 transition-colors ${
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

                  <div className="mb-6 border-t border-gray-200 pt-6">
                    <button
                      onClick={() => setShareModalOpen(true)}
                      className="btn-white w-full flex items-center justify-center space-x-2"
                    >
                      <Share2 size={16} />
                      <span>Share Event</span>
                    </button>
                  </div>

                  {event.event_artists && event.event_artists.length > 0 && (
                    <div className="border-t border-gray-200 pt-6">
                      <h2 className="text-xl font-bold font-urbanist text-gray-900 mb-4">FEATURING</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {event.event_artists.map(({ artist }) => (
                          <Link
                            key={artist.id}
                            to={`/artists/${artist.slug}`}
                            onClick={onClose}
                            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {artist.image_url && (
                              <img
                                src={artist.image_url}
                                alt={artist.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                                {artist.name}
                              </h3>
                              {artist.artist_type && (
                                <p className="text-sm text-gray-600 truncate">{artist.artist_type}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.venue && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
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
                          onClick={onClose}
                          className="btn-white w-full text-center inline-block"
                        >
                          View Venue Details
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
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
