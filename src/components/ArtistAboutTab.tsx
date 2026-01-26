import React from 'react'
import { Artist, Work } from '../lib/supabase'

interface ArtistAboutTabProps {
  artist: Artist
  works: Work[]
}

export const ArtistAboutTab: React.FC<ArtistAboutTabProps> = ({
  artist,
  works,
}) => {
  // Get first work image or artist image for the large artwork
  const artworkImage = works.length > 0 && works[0].image_url
    ? works[0].image_url
    : artist.image_url || artist.avatar_url

  // Format subtitle - placeholder text (e.g., "American, b. 1968")
  // For now, we'll use a placeholder or artist_type if available
  const subtitle = 'American, b. 1968' // Placeholder as per plan

  return (
    <div className="space-y-8">
      {/* Large Artwork Image */}
      {artworkImage && (
        <div className="w-full rounded-xl overflow-hidden">
          <img
            src={artworkImage}
            alt={artist.name}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* About Section */}
      <div>
        
        {artist.bio && (
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line mb-8">
              {artist.bio}
            </p>
          </div>
        )}
      </div>


      {!artist.bio && !artist.tagline && (
        <div className="text-center py-12">
          <p className="text-gray-500">No information available.</p>
        </div>
      )}
    </div>
  )
}
