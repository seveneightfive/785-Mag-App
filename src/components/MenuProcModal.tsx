import React from 'react'
import { X, MapPin, User, Calendar, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MenuProc } from '../lib/supabase'

interface MenuProcModalProps {
  menuProc: MenuProc | null
  isOpen: boolean
  onClose: () => void
}

export const MenuProcModal: React.FC<MenuProcModalProps> = ({
  menuProc,
  isOpen,
  onClose
}) => {
  if (!isOpen || !menuProc) return null

  const hasImages = menuProc.images && menuProc.images.length > 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* Header with close button */}
          <div className={`${hasImages ? 'absolute' : 'relative'} top-4 right-4 z-10`}>
            <button
              onClick={onClose}
              className={`${hasImages ? 'bg-black/20 backdrop-blur-sm text-white hover:bg-black/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} p-2 rounded-full transition-colors`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Images - Only show if images exist */}
          {hasImages && (
            <div className="aspect-video bg-gray-200 overflow-hidden rounded-t-2xl">
              {menuProc.images.length === 1 ? (
                <img
                  src={menuProc.images[0]}
                  alt={menuProc.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="grid grid-cols-2 gap-1 h-full">
                  {menuProc.images.slice(0, 2).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${menuProc.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ))}
                  {menuProc.images.length > 2 && (
                    <div className="relative">
                      <img
                        src={menuProc.images[2]}
                        alt={`${menuProc.title} 3`}
                        className="w-full h-full object-cover"
                      />
                      {menuProc.images.length > 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            +{menuProc.images.length - 2}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {menuProc.title}
            </h2>

            {menuProc.venues && (
              <div className="flex items-center text-orange-600 mb-4">
                <MapPin size={16} className="mr-2" />
                <span className="font-medium">{menuProc.venues.name}</span>
              </div>
            )}

            <div className="prose prose-gray max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {menuProc.content}
              </p>
            </div>

            {/* Meta info */}
            <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
              <div className="flex items-center gap-2">
                {menuProc.profiles?.avatar_url ? (
                  <img
                    src={menuProc.profiles.avatar_url}
                    alt={menuProc.profiles.full_name || menuProc.profiles.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User size={14} />
                )}
                <span>by {menuProc.profiles?.full_name || menuProc.profiles?.username || 'Anonymous'}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                <span>{new Date(menuProc.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action button */}
            {menuProc.venues && (
              <div className="mt-6">
                <Link
                  to={`/venues/${menuProc.venues.slug}`}
                  className="btn-yellow inline-flex items-center space-x-2"
                  onClick={onClose}
                >
                  <span>View {menuProc.venues.name}</span>
                  <ExternalLink size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}