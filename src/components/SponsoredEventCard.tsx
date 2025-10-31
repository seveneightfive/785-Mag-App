import React, { useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import { Advertisement } from '../lib/supabase'
import { ImageWithFallback } from './ImageWithFallback'
import { supabase } from '../lib/supabase'
import { trackAdImpression, trackAdClick } from '../lib/analytics'

interface SponsoredEventCardProps {
  ad: Advertisement
  position: number
  pageType: string
}

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('ad_session_id')
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('ad_session_id', sessionId)
  }
  return sessionId
}

export const SponsoredEventCard: React.FC<SponsoredEventCardProps> = ({ ad, position, pageType }) => {
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!cardRef.current || hasTrackedImpression) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            timerRef.current = setTimeout(async () => {
              await trackImpression()
              setHasTrackedImpression(true)
            }, 1000)
          } else {
            if (timerRef.current) {
              clearTimeout(timerRef.current)
              timerRef.current = null
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(cardRef.current)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      observer.disconnect()
    }
  }, [hasTrackedImpression])

  const trackImpression = async () => {
    try {
      const sessionId = getSessionId()
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('ad_impressions').insert({
        ad_id: ad.id,
        user_id: user?.id || null,
        page_type: pageType,
        position: position,
        session_id: sessionId
      })

      trackAdImpression({
        ad_id: ad.id,
        ad_title: ad.headline || ad.title,
        position: position,
        page_type: pageType
      })
    } catch (error) {
      console.error('Error tracking impression:', error)
    }
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()

    try {
      const sessionId = getSessionId()
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('ad_clicks').insert({
        ad_id: ad.id,
        user_id: user?.id || null,
        page_type: pageType,
        position: position,
        session_id: sessionId
      })

      trackAdClick({
        ad_id: ad.id,
        ad_title: ad.headline || ad.title,
        position: position,
        page_type: pageType,
        destination_url: ad.button_link
      })

      window.open(ad.button_link, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error tracking click:', error)
      window.open(ad.button_link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="block bg-black rounded-xl shadow-lg hover:shadow-xl active:shadow-2xl transition-all duration-200 overflow-hidden group cursor-pointer touch-manipulation"
    >
      <div className="relative aspect-[4/3] lg:aspect-[16/9] bg-gray-200 overflow-hidden">
        <ImageWithFallback
          src={ad.ad_image_url || ad.background_image}
          alt={ad.headline || ad.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackType="event"
        />

        <div className="absolute top-0 left-0 bg-yellow-400 rounded-br-lg px-3 py-2 lg:px-4 lg:py-3 shadow-sm z-10">
          <div className="flex items-center space-x-1">
            <Heart size={14} className="text-pink-600 fill-current lg:w-4 lg:h-4" />
            <div className="text-[10px] lg:text-xs font-bold text-pink-600 uppercase tracking-wide">
              Sponsored Love
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 lg:p-4">
        {ad.headline && (
          <div className="text-xs lg:text-sm font-medium mb-1 uppercase tracking-wide text-yellow-400">
            {ad.headline}
          </div>
        )}

        <h3 className="font-medium text-base lg:text-lg text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors font-urbanist uppercase tracking-wide">
          {ad.ad_copy || ad.title}
        </h3>

        {ad.content && (
          <p className="text-xs lg:text-sm text-gray-300 mb-3 line-clamp-2">
            {ad.content}
          </p>
        )}

        {ad.button_text && (
          <div className="flex items-center justify-between">
            <span className="text-xs lg:text-sm font-semibold text-yellow-400">
              {ad.button_text} →
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
