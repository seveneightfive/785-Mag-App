import React from 'react'
import { ExternalLink } from 'lucide-react'
import { Announcement } from '../lib/supabase'

interface AnnouncementCardProps {
  announcement: Announcement
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
  const handleLearnMore = () => {
    // Open in new window - using a placeholder URL or custom link
    const url = 'https://example.com' // Replace with actual learnmore_link when available
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{announcement.content}</p>
      <button
        onClick={handleLearnMore}
        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
      >
        Learn More
        <ExternalLink size={16} className="ml-2" />
      </button>
    </div>
  )
}
