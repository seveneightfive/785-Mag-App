import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Music, Palette, Mic, BookOpen } from 'lucide-react'
import { ImageWithFallback } from './ImageWithFallback'
import type { Artist } from '../lib/supabase'

interface HomepageArtistCardProps {
  artist: Artist & {
    upcomingEventsCount?: number
  }
}

const getArtistTypeIcon = (type?: string) => {
  switch (type) {
    case 'Musician':
      return <Music size={14} />
    case 'Visual':
      return <Palette size={14} />
    case 'Performance':
      return <Mic size={14} />
    case 'Literary':
      return <BookOpen size={14} />
    default:
      return <Music size={14} />
  }
}

export const HomepageArtistCard: React.FC<HomepageArtistCardProps> = ({ artist }) => {
  const imageSrc = artist.image_url || artist.avatar_url

  return (
    <Link
      to={`/artists/${artist.slug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-200 overflow-hidden">
        <ImageWithFallback
          src={imageSrc}
          alt={artist.name}
          fallbackType="artist"
          width={320}
          height={320}
          loading="eager"
          fetchpriority="high"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-urbanist text-base font-semibold text-gray-900 uppercase tracking-wide mb-2 group-hover:text-purple-600 transition-colors">
          {artist.name}
        </h3>

        {/* Artist Type */}
        {artist.artist_type && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            {getArtistTypeIcon(artist.artist_type)}
            <span>{artist.artist_type}</span>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} />
          <span>
            {artist.upcomingEventsCount ?? 0} upcoming event
            {(artist.upcomingEventsCount ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </Link>
  )
}
