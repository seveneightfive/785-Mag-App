import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Heart, Building2 } from 'lucide-react'
import { supabase, type Organizer } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ImageWithFallback } from './ImageWithFallback'

interface OrganizerCardProps {
  organizer: Organizer
}

export const OrganizerCard: React.FC<OrganizerCardProps> = ({ organizer }) => {
  const { user } = useAuth()
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [logoAspectRatio, setLogoAspectRatio] = useState<number>(1)

  useEffect(() => {
    fetchUpcomingEventsCount()
    if (user) {
      checkFollowStatus()
    }
  }, [organizer.id])

  useEffect(() => {
    if (user) {
      checkFollowStatus()
    } else {
      setIsFollowing(false)
    }
  }, [user])

  const fetchUpcomingEventsCount = async () => {
    const { count } = await supabase
      .from('event_organizers')
      .select('events!inner(start_date)', { count: 'exact', head: true })
      .eq('organizer_id', organizer.id)
      .gte('events.start_date', new Date().toISOString())

    setUpcomingEventsCount(count || 0)
  }

  const checkFollowStatus = async () => {
    if (!user) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('entity_type', 'organizer')
      .eq('entity_id', organizer.id)
      .maybeSingle()

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
          .eq('entity_type', 'organizer')
          .eq('entity_id', organizer.id)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            entity_type: 'organizer',
            entity_id: organizer.id
          })
      }
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('Error following organizer:', error)
    } finally {
      setFollowLoading(false)
    }
  }, [user, organizer.id, isFollowing])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setLogoAspectRatio(img.naturalWidth / img.naturalHeight)
  }

  const getLogoContainerClass = (aspectRatio: number) => {
    if (aspectRatio > 1.5) return "w-24 h-16"
    if (aspectRatio < 0.7) return "w-16 h-24"
    return "w-20 h-20"
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <Link to={`/organizers/${organizer.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden bg-gray-50 flex items-center justify-center">
          <div className={`${getLogoContainerClass(logoAspectRatio)} flex items-center justify-center bg-white rounded-lg overflow-hidden border border-gray-200`}>
            {organizer.logo ? (
              <img
                src={organizer.logo}
                alt={organizer.name}
                className="max-w-full max-h-full object-contain p-3"
                onLoad={handleImageLoad}
              />
            ) : (
              <Building2 size={40} className="text-gray-400" />
            )}
          </div>

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
      </Link>

      <div className="p-4">
        <Link to={`/organizers/${organizer.slug}`} className="block">
          <h3 className="font-urbanist text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors mb-2 uppercase tracking-wide">
            {organizer.name.toUpperCase()}
          </h3>
        </Link>

        {organizer.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {organizer.description}
          </p>
        )}

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
              title={isFollowing ? 'Unfollow organizer' : 'Follow organizer'}
            >
              <Heart size={16} fill={isFollowing ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
