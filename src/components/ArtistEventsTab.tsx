import React from 'react'
import { MapPin, Clock } from 'lucide-react'
import { Event, Announcement } from '../lib/supabase'

interface ArtistEventsTabProps {
  events: Event[]
  announcements: Announcement[]
  onEventClick: (eventSlug: string) => void
}

export const ArtistEventsTab: React.FC<ArtistEventsTabProps> = ({
  events,
  announcements,
  onEventClick,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatEventTime = (event: Event) => {
    if (event.event_start_time && event.event_end_time) {
      // Use event_start_time and event_end_time if available
      return `${event.event_start_time} - ${event.event_end_time}`
    } else if (event.event_start_time) {
      return event.event_start_time
    } else {
      // Fallback to parsing from date
      const start = new Date(event.start_date)
      const startTime = formatTime(event.start_date)
      if (event.end_date) {
        const end = new Date(event.end_date)
        if (start.toDateString() === end.toDateString()) {
          const endTime = formatTime(event.end_date)
          return `${startTime} - ${endTime}`
        }
      }
      return startTime
    }
  }

  return (
    <div className="space-y-8">
      {/* Events Section */}
      {events.length > 0 && (
        <div className="space-y-8">
          {events.map((event) => (
            <div key={event.id} className="space-y-4">
              {/* Event Title - Uppercase */}
              <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">
                {event.title}
              </h2>
              
              {/* Date */}
              <p className="text-lg text-gray-600">
                {formatDate(event.start_date)}
              </p>
              
              {/* Subtitle/Description */}
              {event.description && (
                <p className="text-base text-gray-700">
                  {event.description.split('\n')[0]}
                </p>
              )}

              {/* Event Image */}
              {event.image_url && (
                <div className="w-full rounded-xl overflow-hidden">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Time & Location Section */}
              <div className="space-y-3 pt-4">
                <h3 className="text-lg font-bold text-gray-900">Time & Location</h3>
                <div className="space-y-2 text-gray-700">
                  {event.start_date && (
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-gray-500" />
                      <span>{formatEventTime(event)}</span>
                    </div>
                  )}
                  {event.venue && (
                    <div className="flex items-start gap-2">
                      <MapPin size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{event.venue.name}</div>
                        {event.venue.address && (
                          <div className="text-sm text-gray-600">{event.venue.address}</div>
                        )}
                        {(event.venue.city || event.venue.state) && (
                          <div className="text-sm text-gray-600">
                            {[event.venue.city, event.venue.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* About The Event Section */}
              {event.description && (
                <div className="pt-4 space-y-3">
                  <h3 className="text-lg font-bold text-gray-900">About The Event</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Click to view details */}
              <button
                onClick={() => onEventClick(event.slug || '')}
                className="text-blue-600 hover:text-blue-700 font-medium mt-4"
              >
                View Event Details →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <div className="space-y-8">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">
                {announcement.title}
              </h2>
              
              {announcement.created_at && (
                <p className="text-lg text-gray-600">
                  {formatDate(announcement.created_at)}
                </p>
              )}
              
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {announcement.content}
              </p>
              
              {announcement.learnmore_link && (
                <a
                  href={announcement.learnmore_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-600 hover:text-blue-700 font-medium"
                >
                  Learn More →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {events.length === 0 && announcements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No events or announcements available.</p>
        </div>
      )}
    </div>
  )
}
