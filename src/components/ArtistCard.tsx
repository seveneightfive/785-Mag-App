import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Music, Palette, Mic, BookOpen, Heart } from 'lucide-react'
import { supabase, type Artist } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface ArtistCardProps {
  artist: Artist
}

const getArtistTypeIcon = (type: string) => {
  switch (type) {
    case 'Musician':
      return <Music size={16} />
    case 'Visual':
      return <Palette size={16} />
    case 'Performance':
      return <Mic size={16} />
    case 'Literary':
      return <BookOpen size={16} />
    default:
      return <Music size={16} />
  }
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const { user } = useAuth()
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    fetchUpcomingEventsCount()
    if (user) {
      checkFollowStatus()
    }
  }, [artist.id])

  useEffect(() => {
    if (user) {
      checkFollowStatus()
    } else {
      setIsFollowing(false)
    }
  }, [user])
  const fetchUpcomingEventsCount = async () => {
    const { count } = await supabase
      .from('event_artists')
      .select('events!inner(start_date)', { count: 'exact', head: true })
      .eq('artist_id', artist.id)
      .gte('events.start_date', new Date().toISOString())

    setUpcomingEventsCount(count || 0)
  }

  const checkFollowStatus = async () => {
    if (!user) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('entity_type', 'artist')
      .eq('entity_id', artist.id)
      .single()

    setIsFollowing(!!data)
  }

  const handleFollow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('entity_type', 'artist')
          .eq('entity_id', artist.id)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            entity_type: 'artist',
            entity_id: artist.id
          })
      }
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('Error following artist:', error)
    } finally {
      setFollowLoading(false)
    }
  }, [user, artist.id, isFollowing])
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Artist Image */}
      <Link to={`/artists/${artist.slug}`} className="block">
        <div className="aspect-square bg-gray-200 overflow-hidden">
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
              {getArtistTypeIcon(artist.artist_type || 'Musician')}
            </div>
          )}
        </div>
      </Link>

      {/* Artist Info */}
      <div className="p-4">
        <Link to={`/artists/${artist.slug}`} className="block">
          <h3 className="font-oswald text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors mb-2 uppercase tracking-wide">
            {artist.name.toUpperCase()}
          </h3>
        </Link>

        {/* Genres/Mediums */}
        {artist.musical_genres && artist.musical_genres.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {artist.musical_genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="inline-block bg-black text-white text-xs px-2 py-1 rounded-full"
                >
                  {genre}
                </span>
              ))}
              {artist.musical_genres.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{artist.musical_genres.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {artist.visual_mediums && artist.visual_mediums.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {artist.visual_mediums.slice(0, 2).map((medium) => (
                <span
                  key={medium}
                  className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                >
                  {medium}
                </span>
              ))}
              {artist.visual_mediums.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{artist.visual_mediums.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Events Count and Follow Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={14} />
            <span>
              {upcomingEventsCount} upcoming event{upcomingEventsCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          {user && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`p-2 rounded-full transition-colors ${
                isFollowing 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-400 hover:text-red-500'
              } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isFollowing ? 'Unfollow artist' : 'Follow artist'}
            >
              <Heart size={16} fill={isFollowing ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}