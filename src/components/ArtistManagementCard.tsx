import React, { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, ExternalLink, Music } from 'lucide-react'
import { ImageWithFallback } from './ImageWithFallback'
import { EditableEventRow } from './EditableEventRow'
import { type Artist, type Event } from '../lib/supabase'

interface ArtistManagementCardProps {
  artist: Artist
  events: Event[]
  onEventUpdate: () => void
  canEditEvent: (event: Event) => boolean
}

export const ArtistManagementCard: React.FC<ArtistManagementCardProps> = ({
  artist,
  events,
  onEventUpdate,
  canEditEvent
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const upcomingEvents = events.filter(
    (e) => new Date(e.start_date) >= new Date()
  ).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  const pastEvents = events.filter(
    (e) => new Date(e.start_date) < new Date()
  ).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
            <ImageWithFallback
              src={artist.image_url || artist.avatar_url}
              alt={artist.name}
              className="w-full h-full object-cover"
              fallbackType="artist"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {artist.name}
            </h3>

            {artist.artist_type && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <Music size={14} />
                <span>{artist.artist_type}</span>
              </div>
            )}

            {artist.musical_genres && artist.musical_genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {artist.musical_genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="inline-block bg-black text-white text-xs px-2 py-1 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
                {artist.musical_genres.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{artist.musical_genres.length - 3} more
                  </span>
                )}
              </div>
            )}

            {artist.visual_mediums && artist.visual_mediums.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {artist.visual_mediums.slice(0, 3).map((medium) => (
                  <span
                    key={medium}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {medium}
                  </span>
                ))}
                {artist.visual_mediums.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{artist.visual_mediums.length - 3} more
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center space-x-3">
              {artist.edit_link && (
                <a
                  href={artist.edit_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#FFCE03] hover:bg-[#E5B902] text-black text-sm font-medium rounded-lg transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Edit Artist</span>
                </a>
              )}

              {events.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <Calendar size={14} />
                  <span>{events.length} event{events.length !== 1 ? 's' : ''}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {isExpanded && events.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {upcomingEvents.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Upcoming Events ({upcomingEvents.length})</span>
                </h4>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <EditableEventRow
                      key={event.id}
                      event={event}
                      canEdit={canEditEvent(event)}
                      onUpdate={onEventUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3 flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Past Events ({pastEvents.length})</span>
                </h4>
                <div className="space-y-2 opacity-60">
                  {pastEvents.slice(0, 5).map((event) => (
                    <EditableEventRow
                      key={event.id}
                      event={event}
                      canEdit={canEditEvent(event)}
                      onUpdate={onEventUpdate}
                    />
                  ))}
                  {pastEvents.length > 5 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      and {pastEvents.length - 5} more past events
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {events.length === 0 && (
          <div className="mt-4 text-center py-6 text-gray-400 text-sm">
            No events featuring this artist yet
          </div>
        )}
      </div>
    </div>
  )
}
