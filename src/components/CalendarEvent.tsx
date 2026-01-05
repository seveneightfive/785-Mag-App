import React from 'react'
import { MoreVertical } from 'lucide-react'

interface CalendarEventProps {
  time: string
  title: string
  subtitle: string
  color?: string
  onClick?: () => void
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({
  time,
  title,
  subtitle,
  color = 'bg-orange-400',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-start space-x-3 py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
    >
      <div className="text-sm font-medium text-gray-900 w-16 flex-shrink-0">
        {time}
      </div>
      <div className={`w-1 h-full ${color} rounded-full flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
        <MoreVertical size={14} className="text-gray-400" />
      </button>
    </div>
  )
}
