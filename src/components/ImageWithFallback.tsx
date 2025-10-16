import React, { useState } from 'react'
import { Calendar, Music, MapPin, Image as ImageIcon } from 'lucide-react'

interface ImageWithFallbackProps {
  src?: string | null
  alt: string
  className?: string
  fallbackType?: 'event' | 'artist' | 'venue' | 'generic'
  fallbackGradient?: string
  onLoad?: () => void
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackType = 'generic',
  fallbackGradient,
  onLoad,
}) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const getFallbackIcon = () => {
    const iconSize = 48
    const iconClass = 'opacity-50'

    switch (fallbackType) {
      case 'event':
        return <Calendar size={iconSize} className={iconClass} />
      case 'artist':
        return <Music size={iconSize} className={iconClass} />
      case 'venue':
        return <MapPin size={iconSize} className={iconClass} />
      default:
        return <ImageIcon size={iconSize} className={iconClass} />
    }
  }

  const getDefaultGradient = () => {
    switch (fallbackType) {
      case 'event':
        return 'from-blue-500 to-purple-600'
      case 'artist':
        return 'from-purple-500 to-pink-600'
      case 'venue':
        return 'from-teal-500 to-green-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    if (onLoad) {
      onLoad()
    }
  }

  if (!src || imageError) {
    return (
      <div
        className={`${className} bg-gradient-to-br ${
          fallbackGradient || getDefaultGradient()
        } flex items-center justify-center text-white`}
      >
        {getFallbackIcon()}
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div
          className={`${className} bg-gray-200 animate-pulse`}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </>
  )
}
