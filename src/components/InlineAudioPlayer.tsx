import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, ExternalLink } from 'lucide-react'

interface InlineAudioPlayerProps {
  audioUrl: string
  title: string
  artistName: string
  purchaseLink?: string
}

export const InlineAudioPlayer: React.FC<InlineAudioPlayerProps> = ({
  audioUrl,
  title,
  artistName,
  purchaseLink,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', () => setIsPlaying(false))

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', () => setIsPlaying(false))
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    if (!isNaN(newTime) && isFinite(newTime)) {
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = parseFloat(e.target.value)
    if (!isNaN(newVolume) && isFinite(newVolume)) {
      audio.volume = newVolume
      setVolume(newVolume)
    }
  }

  const formatTime = (time: number) => {
    if (!time || isNaN(time) || !isFinite(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <audio ref={audioRef} src={audioUrl} />
      
      <div className="flex flex-col space-y-4">
        {/* Track Info and Play Button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlay}
            className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition-colors flex-shrink-0"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900 truncate">{title}</h4>
            <p className="text-sm text-gray-600 truncate">{artistName}</p>
          </div>

          {purchaseLink && (
            <a
              href={purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-500 transition-colors flex items-center space-x-1 flex-shrink-0"
            >
              <span>Buy</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration && isFinite(duration) ? duration : 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: duration > 0 ? `linear-gradient(to right, #9333ea 0%, #9333ea ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)` : '#e5e7eb'
            }}
          />
          <span className="text-xs text-gray-500 w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Volume2 size={16} className="text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
