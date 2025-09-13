import React, { useState, useEffect } from 'react'
import { MapPin, Calendar, Phone, Globe, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, type Venue } from '../lib/supabase'

interface VenueCardProps {
  venue: Venue
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0)

  useEffect(() => {
    fetchUpcomingEventsCount()
  }, [venue.id])

  const fetchUpcomingEventsCount = async () => {
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venue.id)
      .gte('start_date', new Date().toISOString())

    setUpcomingEventsCount(count || 0)
  }

  // Extract just the street address (first part before comma)
  const streetAddress = venue.address.split(',')[0].trim()

  return (
    <Link 
      to={`/venues/${venue.slug}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      <div className="relative">
        {venue.image_url && (
          <div className="aspect-video overflow-hidden">
            <img
              src={venue.image_url}
              alt={venue.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}
        
        {/* Venue Type Tag - Bottom Left */}
        {venue.venue_type && (
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 bg-black/80 text-white text-xs rounded-full backdrop-blur-sm">
              {venue.venue_type}
            </span>
          </div>
        )}
        
        {/* Event Count Badge - Top Right, overlapping image by 50% */}
        {upcomingEventsCount > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-black text-sm font-bold shadow-lg"
              style={{ backgroundColor: '#FFCE03' }}
            >
              {upcomingEventsCount}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6 relative">
        <h3 className="font-oswald text-xl font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-wide">
          {venue.name.toUpperCase()}
        </h3>
        
        <div className="flex items-start space-x-2 text-gray-600 mb-3">
          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
          <span className="text-sm">{streetAddress}</span>
        </div>

      </div>
    </Link>
  )
}