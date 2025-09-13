import React from 'react'
import { MapPin, User, Calendar } from 'lucide-react'
import { MenuProc } from '../lib/airtable'

interface MenuProcCardProps {
  menuProc: MenuProc
  onClick?: () => void
  showVenue?: boolean
}

export const MenuProcCard: React.FC<MenuProcCardProps> = ({ 
  menuProc, 
  onClick, 
  showVenue = true 
}) => {
  const primaryImage = menuProc.images?.[0]

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-gray-200 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={menuProc.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {menuProc.title}
        </h3>

        {showVenue && menuProc.venues && (
          <div className="flex items-center text-orange-600 mb-2">
            <MapPin size={14} className="mr-1" />
            <span className="text-sm font-medium">{menuProc.venues.name}</span>
          </div>
        )}

        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
          {menuProc.content}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <User size={12} className="mr-1" />
            <span>{menuProc.profiles?.username || 'Anonymous'}</span>
          </div>
          <div className="flex items-center">
            <Calendar size={12} className="mr-1" />
            <span>{new Date(menuProc.created_at || '').toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}