import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, type Announcement, type AnnouncementReaction } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export const AnnouncementBanner: React.FC = () => {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const [reactionCounts, setReactionCounts] = useState<Record<string, { no: number, yes: number }>>({})
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({})
  const [hiddenAnnouncements, setHiddenAnnouncements] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAnnouncements()
    loadHiddenAnnouncements()
  }, [])

  useEffect(() => {
    if (announcements.length > 1 && isAutoScrolling) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length)
      }, 6000)
      return () => clearInterval(interval)
    }
  }, [announcements.length, isAutoScrolling])

  const loadHiddenAnnouncements = () => {
    const now = new Date().getTime()
    
    if (!user) {
      // Load from cookies for non-logged in users
      const hiddenCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('hiddenAnnouncements='))
      
      if (hiddenCookie) {
        try {
          const hiddenData = JSON.parse(decodeURIComponent(hiddenCookie.split('=')[1]))
          const validIds = Object.keys(hiddenData).filter(id => hiddenData[id] > now)
          setHiddenAnnouncements(new Set(validIds))
        } catch (error) {
          console.error('Error parsing hidden announcements cookie:', error)
        }
      }
    } else {
      // Load from localStorage for logged in users
      try {
        const hiddenData = JSON.parse(localStorage.getItem('hiddenAnnouncements') || '{}')
        const validIds = Object.keys(hiddenData).filter(id => hiddenData[id] > now)
        setHiddenAnnouncements(new Set(validIds))
        
        // Clean up expired entries
        const cleanedData = {}
        validIds.forEach(id => {
          cleanedData[id] = hiddenData[id]
        })
        localStorage.setItem('hiddenAnnouncements', JSON.stringify(cleanedData))
      } catch (error) {
        console.error('Error loading hidden announcements from localStorage:', error)
      }
    }
  }

  const saveHiddenAnnouncement = (announcementId: string) => {
    const now = new Date()
    const expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
    
    if (!user) {
      // Save to cookies for non-logged in users
      const hiddenData = { [announcementId]: expiryTime.getTime() }
      
      // Get existing hidden announcements from cookie
      const existingCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('hiddenAnnouncements='))
      
      if (existingCookie) {
        try {
          const existingData = JSON.parse(decodeURIComponent(existingCookie.split('=')[1]))
          Object.assign(hiddenData, existingData)
        } catch (error) {
          console.error('Error parsing existing hidden announcements:', error)
        }
      }
      
      // Clean up expired entries
      Object.keys(hiddenData).forEach(id => {
        if (hiddenData[id] < now.getTime()) {
          delete hiddenData[id]
        }
      })
      
      const cookieExpires = new Date()
      cookieExpires.setFullYear(cookieExpires.getFullYear() + 1)
      
      document.cookie = `hiddenAnnouncements=${encodeURIComponent(JSON.stringify(hiddenData))}; expires=${cookieExpires.toUTCString()}; path=/`
      
      setHiddenAnnouncements(new Set([...hiddenAnnouncements, announcementId]))
    } else {
      // For logged in users, save to localStorage with expiry
      const hiddenData = JSON.parse(localStorage.getItem('hiddenAnnouncements') || '{}')
      hiddenData[announcementId] = expiryTime.getTime()
      
      // Clean up expired entries
      Object.keys(hiddenData).forEach(id => {
        if (hiddenData[id] < now.getTime()) {
          delete hiddenData[id]
        }
      })
      
      localStorage.setItem('hiddenAnnouncements', JSON.stringify(hiddenData))
      setHiddenAnnouncements(new Set([...hiddenAnnouncements, announcementId]))
    }
  }

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) {
      setAnnouncements(data)
      fetchReactionCounts(data.map(a => a.id))
      if (user) {
        fetchUserReactions(data.map(a => a.id))
      }
    }
  }

  const fetchReactionCounts = async (announcementIds: string[]) => {
    if (announcementIds.length === 0) return

    const { data } = await supabase
      .from('announcement_reactions')
      .select('announcement_id, reaction_type')
      .in('announcement_id', announcementIds)

    const counts: Record<string, { no: number, yes: number }> = {}
    announcementIds.forEach(id => {
      counts[id] = { no: 0, yes: 0 }
    })

    data?.forEach(reaction => {
      if (counts[reaction.announcement_id]) {
        if (reaction.reaction_type === 'thumbs_up') {
          counts[reaction.announcement_id].yes++
        } else if (reaction.reaction_type === 'heart') {
          counts[reaction.announcement_id].no++
        }
      }
    })

    setReactionCounts(counts)
  }

  const fetchUserReactions = async (announcementIds: string[]) => {
    if (!user || announcementIds.length === 0) return

    const { data } = await supabase
      .from('announcement_reactions')
      .select('announcement_id, reaction_type')
      .eq('user_id', user.id)
      .in('announcement_id', announcementIds)

    const reactions: Record<string, string[]> = {}
    data?.forEach(reaction => {
      if (!reactions[reaction.announcement_id]) {
        reactions[reaction.announcement_id] = []
      }
      reactions[reaction.announcement_id].push(reaction.reaction_type)
    })

    setUserReactions(reactions)

    // Hide announcements that logged-in users have voted on
    const votedAnnouncementIds = Object.keys(reactions)
    if (votedAnnouncementIds.length > 0) {
      setHiddenAnnouncements(prev => new Set([...prev, ...votedAnnouncementIds]))
    }
  }

  const handleReaction = async (announcementId: string, reactionType: 'heart' | 'thumbs_up') => {
    // Track the vote
    if (user) {
      await supabase
        .from('announcement_reactions')
        .insert({
          user_id: user.id,
          announcement_id: announcementId,
          reaction_type: reactionType
        })
    } else {
      // For non-logged in users, we still track in the database but without user_id
      await supabase
        .from('announcement_reactions')
        .insert({
          user_id: null,
          announcement_id: announcementId,
          reaction_type: reactionType
        })
    }

    // Hide the announcement
    saveHiddenAnnouncement(announcementId)

    // Refresh data
    fetchReactionCounts([announcementId])
    if (user) {
      fetchUserReactions([announcementId])
    }
  }

  const nextAnnouncement = () => {
    setIsAutoScrolling(false)
    setCurrentIndex((prev) => (prev + 1) % announcements.length)
  }

  const prevAnnouncement = () => {
    setIsAutoScrolling(false)
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)
  }

  // Filter out hidden announcements
  const visibleAnnouncements = announcements.filter(announcement => 
    !hiddenAnnouncements.has(announcement.id)
  )

  if (!isVisible || visibleAnnouncements.length === 0) {
    return null
  }

  const currentAnnouncement = visibleAnnouncements[currentIndex % visibleAnnouncements.length]
  const currentReactions = reactionCounts[currentAnnouncement?.id] || { no: 0, yes: 0 }
  const currentUserReactions = userReactions[currentAnnouncement?.id] || []

  const getEntityLink = (announcement: Announcement) => {
    if (announcement.entity_type === 'event' && announcement.entity_id) {
      return `/events/${announcement.entity_id}`
    }
    if (announcement.entity_type === 'artist' && announcement.entity_id) {
      return `/artists/${announcement.entity_id}`
    }
    if (announcement.entity_type === 'venue' && announcement.entity_id) {
      return `/venues/${announcement.entity_id}`
    }
    return null
  }

  const getEntityName = (announcement: Announcement) => {
    if (announcement.entity_type === 'event') {
      return 'Event'
    }
    if (announcement.entity_type === 'artist') {
      return 'Artist'
    }
    if (announcement.entity_type === 'venue') {
      return 'Venue'
    }
    return null
  }

  return (
    <div className="bg-black text-white relative overflow-hidden border-b-4 border-white">
      <div className="relative w-full lg:max-w-7xl lg:mx-auto px-0 lg:px-8">
        <div className="py-8">
          <div className="flex items-center justify-between mb-6 px-4 lg:px-0">
            <div className="flex items-center space-x-2">
              {visibleAnnouncements.length > 1 && (
                <button
                  onClick={prevAnnouncement}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  onMouseEnter={() => setIsAutoScrolling(false)}
                  onMouseLeave={() => setIsAutoScrolling(true)}
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              
              {visibleAnnouncements.length > 1 && (
                <button
                  onClick={nextAnnouncement}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  onMouseEnter={() => setIsAutoScrolling(false)}
                  onMouseLeave={() => setIsAutoScrolling(true)}
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center px-4 lg:px-0">
            {/* Left: Title and Content */}
            <div className="lg:col-span-2">
              <h3 className="text-3xl lg:text-4xl font-bold mb-4 font-outfit">
                {currentAnnouncement.title}
              </h3>
              <p className="text-lg opacity-90 mb-6 font-outfit">
                {currentAnnouncement.content}
              </p>
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex flex-col space-y-3">
              {currentAnnouncement.learnmore_link && (
                <a
                  href={currentAnnouncement.learnmore_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#C80650] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#A0052E] transition-colors flex items-center justify-center space-x-2 font-outfit uppercase tracking-wide"
                >
                  <span>Learn More</span>
                  <ExternalLink size={16} />
                </a>
              )}
              
              {getEntityLink(currentAnnouncement) && (
                <Link
                  to={getEntityLink(currentAnnouncement)!}
                  className="bg-[#FFCE03] text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors text-center font-outfit uppercase tracking-wide"
                >
                  {getEntityName(currentAnnouncement)} Link
                </Link>
              )}
            </div>
          </div>
          
          {/* Bottom: Relevance Question and Voting */}
          <div className="mt-8 pt-6 border-t border-white/20 px-4 lg:px-0">
            <p className="text-lg text-white mb-4 font-outfit">Did you find this announcement relevant?</p>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleReaction(currentAnnouncement.id, 'heart')}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 font-outfit"
              >
                <span>No</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">({currentReactions.no})</span>
              </button>
              
              <button
                onClick={() => handleReaction(currentAnnouncement.id, 'thumbs_up')}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 font-outfit"
              >
                <span>Yes</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">({currentReactions.yes})</span>
              </button>
            </div>
          </div>
        </div>

        {visibleAnnouncements.length > 1 && (
          <div className="flex justify-center space-x-2 pb-4">
            {visibleAnnouncements.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoScrolling(false)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}