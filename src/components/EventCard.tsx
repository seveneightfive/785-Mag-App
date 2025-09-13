import React from 'react'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Event } from '../lib/supabase'

interface EventCardProps {
  event: Event
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const allArtists = event.event_artists || []

  return (
    <Link 
      to={`/events/${event.slug}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      {/* Event Image - Taller aspect ratio */}
      <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-white opacity-50" />
          </div>
        )}
        
        {/* Date Badge - Upper Left */}
        <div className="absolute top-0 left-0 bg-yellow-400 rounded-br-lg px-4 py-3 shadow-sm">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide text-center">
            {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
          </div>
          <div className="text-2xl font-bold text-black text-center">
            {new Date(event.start_date).getDate()}
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-4">
        {/* Venue - First line */}
        {event.venue && (
          <div className="text-sm font-medium mb-1 uppercase tracking-wide" style={{ color: '#C80650' }}>
            {event.venue.name}
          </div>
        )}

        {/* Event Title - Second line */}
        <h3 className="font-medium text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors font-oswald uppercase tracking-wide">
          {event.title.toUpperCase()}
        </h3>

        {/* Start Time - Third line */}
        {event.event_start_time && (
          <div className="text-gray-600 mb-3">
            <span className="text-sm">
              {event.event_start_time}
            </span>
          </div>
        )}

        {/* Artists - Black pills */}
        {allArtists.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {allArtists.slice(0, 3).map((eventArtist, index) => (
                <span
                  key={eventArtist.artist.id}
                  className="text-xs px-2 py-1 rounded-full bg-black text-white"
                >
                  {eventArtist.artist.name}
                </span>
              ))}
              {allArtists.length > 3 && (
                <span className="text-xs px-2 py-1 rounded-full bg-black text-white">
                  +{allArtists.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Ticket Price */}
        {event.ticket_price && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">From</span>
            <span className="font-semibold text-green-600">
              ${parseFloat(event.ticket_price.toString()).toFixed(0)}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}