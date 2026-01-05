import React from 'react'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Event } from '../lib/supabase'

interface EventCardHorizontalProps {
  event: Event
}

export const EventCardHorizontal: React.FC<EventCardHorizontalProps> = ({ event }) => {
  const allArtists = event.event_artists || []

  const formatTime = (time?: string): string => {
    if (!time) return ''
    return time.replace(/^0/, '')
  }

  return (
    <Link
      to={`/events/${event.slug}`}
      className="block bg-white hover:shadow-lg transition-all duration-200 group border-b border-gray-100 last:border-b-0"
    >
      <div className="flex gap-4 p-4">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-200 overflow-hidden rounded">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-50" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors font-urbanist">
            {event.title}
          </h3>

          {event.event_start_time && (
            <div className="text-sm text-gray-900 font-medium mb-1">
              {formatTime(event.event_start_time)}
            </div>
          )}

          {event.venue && (
            <div className="text-sm text-gray-600">
              {event.venue.name}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
