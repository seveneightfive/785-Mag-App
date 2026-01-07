import React from 'react'
import { Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { type Event } from '../lib/supabase'

interface AgendaEventCardProps {
  event: Event
}

export const AgendaEventCard: React.FC<AgendaEventCardProps> = ({ event }) => {
  const formatTime = () => {
    if (event.event_start_time) {
      try {
        const dummyDate = new Date(`2000-01-01T${event.event_start_time}`)
        if (isNaN(dummyDate.getTime())) {
          return null
        }
        return dummyDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      } catch (error) {
        return null
      }
    }
    return null
  }

  const formattedTime = formatTime()
  const allArtists = event.event_artists || []

  return (
    <Link
      to={`/events/${event.slug}`}
      className="block hover:bg-gray-50 transition-colors"
    >
      <div className="p-6 flex gap-6">
        <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-white opacity-50" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xl text-gray-900 mb-2 font-urbanist">
            {event.title}
          </h3>

          <div className="space-y-2 mb-3">
            {formattedTime && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{formattedTime}</span>
                {event.ticket_price ? (
                  <span className="ml-4 text-sm font-semibold text-green-600">
                    ${parseFloat(event.ticket_price.toString()).toFixed(0)}
                  </span>
                ) : (
                  <span className="ml-4 text-sm font-semibold text-green-600">Free</span>
                )}
              </div>
            )}

            {event.venue && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{event.venue.name}</span>
                {event.venue.address && (
                  <span className="text-sm text-gray-500 ml-1">- {event.venue.address}</span>
                )}
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {event.description}
            </p>
          )}

          {allArtists.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allArtists.slice(0, 5).map((eventArtist) => (
                <span
                  key={eventArtist.artist.id}
                  className="text-xs px-3 py-1 rounded-full bg-black text-white"
                >
                  {eventArtist.artist.name}
                </span>
              ))}
              {allArtists.length > 5 && (
                <span className="text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-700">
                  +{allArtists.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
