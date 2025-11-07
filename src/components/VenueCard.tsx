import React, { useState, useEffect } from 'react'
import { MapPin, Calendar, Phone, Globe, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, type Venue } from '../lib/supabase'
import { ImageWithFallback } from './ImageWithFallback'

interface VenueCardProps {
  venue: Venue
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0)
  const [logoAspectRatio, setLogoAspectRatio] = useState<number>(1)

  useEffect(() => {
    fetchUpcomingEventsCount()
  }, [venue.id])

  const fetchUpcomingEventsCount = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venue.id)
      .gte('start_date', today.toISOString())

    setUpcomingEventsCount(count || 0)
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setLogoAspectRatio(img.naturalWidth / img.naturalHeight)
  }

  const getLogoContainerClass = (aspectRatio: number) => {
    if (aspectRatio > 1.5) return "w-24 h-16"
    if (aspectRatio < 0.7) return "w-16 h-24"
    return "w-20 h-20"
  }

  // Extract just the street address (first part before comma)
  const streetAddress = venue.address?.split(',')[0]?.trim() || 'Address not available'

  return (
    <Link 
      to={`/venues/${venue.slug}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      <div className="relative">
        <div className="aspect-video overflow-hidden bg-gray-50 flex items-center justify-center">
          <div className={`${getLogoContainerClass(logoAspectRatio)} flex items-center justify-center bg-white rounded-lg overflow-hidden border border-gray-200`}>
            <ImageWithFallback
              src={venue.logo || venue.image_url}
              alt={venue.name}
              className="max-w-full max-h-full object-contain p-3"
              fallbackType="venue"
              onLoad={handleImageLoad}
            />
          </div>
        </div>
        
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
        <h3 className="font-urbanist text-xl font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-wide">
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