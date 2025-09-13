import React from 'react'
import { DollarSign, MapPin, Calendar, User } from 'lucide-react'
import { Work } from '../lib/supabase'

interface WorksGalleryProps {
  works: Work[]
  title: string
  showCollector?: boolean
}

export const WorksGallery: React.FC<WorksGalleryProps> = ({ works, title, showCollector = false }) => {
  if (works.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {works.map((work) => (
          <div key={work.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {work.image_url && (
              <div className="aspect-square overflow-hidden">
                <img
                  src={work.image_url}
                  alt={work.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{work.title}</h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                {work.medium && (
                  <p><span className="font-medium">Medium:</span> {work.medium}</p>
                )}
                {work.size && (
                  <p><span className="font-medium">Size:</span> {work.size}</p>
                )}
                {work.price && work.is_for_sale && (
                  <div className="flex items-center text-green-600 font-semibold">
                    <DollarSign size={14} className="mr-1" />
                    {work.price}
                  </div>
                )}
                {work.location && (
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1" />
                    {work.location}
                  </div>
                )}
                {work.exhibit && (
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    {work.exhibit}
                  </div>
                )}
                {showCollector && work.user && (
                  <div className="flex items-center text-purple-600">
                    <User size={14} className="mr-1" />
                    <span className="text-xs">Collected by {work.user.username}</span>
                  </div>
                )}
              </div>

              {work.about && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">{work.about}</p>
              )}

              <div className="mt-3 flex justify-between items-center">
                {work.is_for_sale ? (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    For Sale
                  </span>
                ) : work.is_in_collection ? (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                    In Collection
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                    Available
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}