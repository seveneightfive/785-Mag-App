import React from 'react'
import { WorksGallery } from './WorksGallery'
import { VideoPlayer } from './VideoPlayer'
import { InlineAudioPlayer } from './InlineAudioPlayer'
import { Artist, Work } from '../lib/supabase'

interface ArtistPortfolioTabProps {
  artist: Artist
  works: Work[]
}

export const ArtistPortfolioTab: React.FC<ArtistPortfolioTabProps> = ({
  artist,
  works,
}) => {
  return (
    <div className="space-y-12">
      {/* Works Section */}
      {works.length > 0 && (
        <div>
          <WorksGallery works={works} title="" />
        </div>
      )}

      {/* Video Section */}
      {artist.video_url && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Video</h2>
          <VideoPlayer
            videoUrl={artist.video_url}
            title={artist.video_title || `${artist.name} - Video`}
          />
        </div>
      )}

      {/* Audio Section */}
      {artist.audio_file_url && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Audio</h2>
          <InlineAudioPlayer
            audioUrl={artist.audio_file_url}
            title={artist.audio_title || `${artist.name} - Audio`}
            artistName={artist.name}
            purchaseLink={artist.purchase_link}
          />
        </div>
      )}

      {works.length === 0 && !artist.video_url && !artist.audio_file_url && (
        <div className="text-center py-12">
          <p className="text-gray-500">No portfolio content available.</p>
        </div>
      )}
    </div>
  )
}
