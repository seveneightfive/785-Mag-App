import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Music, MapPin } from 'lucide-react'

interface AnimatedStatsProps {
  eventCount: number
  artistCount: number
  venueCount: number
}

export const AnimatedStats: React.FC<AnimatedStatsProps> = ({ 
  eventCount, 
  artistCount, 
  venueCount 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [animatedCounts, setAnimatedCounts] = useState({
    events: 0,
    artists: 0,
    venues: 0
  })
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const animateCount = (
      target: number, 
      setter: (value: number) => void, 
      delay: number = 0
    ) => {
      setTimeout(() => {
        const duration = 2000
        const steps = 60
        const increment = target / steps
        let current = 0
        
        const timer = setInterval(() => {
          current += increment
          if (current >= target) {
            setter(target)
            clearInterval(timer)
          } else {
            setter(Math.floor(current))
          }
        }, duration / steps)
      }, delay)
    }

    // Animate each counter with staggered delays
    animateCount(eventCount, (value) => 
      setAnimatedCounts(prev => ({ ...prev, events: value })), 0)
    animateCount(artistCount, (value) => 
      setAnimatedCounts(prev => ({ ...prev, artists: value })), 500)
    animateCount(venueCount, (value) => 
      setAnimatedCounts(prev => ({ ...prev, venues: value })), 1000)
  }, [isVisible, eventCount, artistCount, venueCount])

  const stats = [
    {
      count: animatedCounts.events,
      label: 'EVENTS',
      link: '/events',
      icon: Calendar,
      color: 'from-blue-500 to-[#C80650]',
      delay: 0
    },
    {
      count: animatedCounts.artists,
      label: 'ARTISTS',
      link: '/artists',
      icon: Music,
      color: 'from-[#C80650] to-purple-600',
      delay: 500
    },
    {
      count: animatedCounts.venues,
      label: 'PLACES',
      link: '/venues',
      icon: MapPin,
      color: 'from-[#FFCE03] to-orange-500',
      delay: 1000
    }
  ]

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold font-urbanist text-gray-900 mb-4">
            DISCOVER LOCAL CULTURE
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our growing community of events, artists, and venues
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <Link
              key={stat.label}
              to={stat.link}
              className="group block text-center transform hover:scale-105 transition-all duration-300"
              style={{
                animationDelay: `${stat.delay}ms`,
                animation: isVisible ? 'fadeInUp 1s ease-out forwards' : 'none',
                opacity: isVisible ? 1 : 0
              }}
            >
              <div className="relative mb-6">
                {/* Animated Circle Background */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 mx-auto rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                </div>
                
                {/* Animated Number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg sm:text-2xl md:text-4xl lg:text-6xl font-bold font-urbanist text-white drop-shadow-lg">
                    {stat.count}
                  </span>
                </div>
              </div>

              
              <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold font-urbanist text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
                {stat.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}