import React, { useState } from 'react'
import { Instagram, Facebook, Globe, Mail } from 'lucide-react'
import { Artist } from '../lib/supabase'
import { ContactModal } from './ContactModal'

interface ArtistProfileSidebarProps {
  artist: Artist
  activeTab: string
  onTabChange: (tab: string) => void
}

export const ArtistProfileSidebar: React.FC<ArtistProfileSidebarProps> = ({
  artist,
  activeTab,
  onTabChange,
}) => {
  const [contactModalOpen, setContactModalOpen] = useState(false)

  // Get social links - check both direct fields and social_links JSONB
  const getSocialUrl = (platform: string): string | null => {
    // Check direct fields first
    switch (platform) {
      case 'website':
        return artist.artist_website || artist.website || null
      case 'facebook':
        return artist.social_facebook || (artist as any).facebook_url || null
      case 'instagram':
        return (artist as any).instagram_url || 
               (artist.social_links && typeof artist.social_links === 'object' && artist.social_links.instagram) || 
               null
      default:
        return null
    }
  }

  const profileImage = artist.avatar_url || artist.image_url
  const websiteUrl = getSocialUrl('website')
  const facebookUrl = getSocialUrl('facebook')
  const instagramUrl = getSocialUrl('instagram')

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'events', label: 'Events' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'collections', label: 'Collections' },
  ]

  return (
    <>
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-white rounded-lg lg:shadow-sm">
        {/* Desktop/Tablet View - Sidebar */}
        <div className="hidden lg:block p-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Profile Image */}
          <div className="flex justify-center mb-6">
            <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-100">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-4xl font-bold">
                    {artist.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Artist Name */}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 uppercase mb-2 text-center lg:text-left tracking-tight">
            {artist.name}
          </h1>

          {/* Location/Type */}
          {artist.artist_type && (
            <p className="text-sm text-gray-600 mb-2 text-center lg:text-left">
              {artist.artist_type}
            </p>
          )}

          {/* Visual Mediums / Musical Genres as Tags */}
          {(artist.visual_mediums || artist.musical_genres) && (
            <div className="flex flex-wrap gap-2 mb-6 justify-center lg:justify-start">
              {artist.visual_mediums && Array.isArray(artist.visual_mediums) && artist.visual_mediums.map((medium, index) => (
                <span
                  key={`visual-${index}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                >
                  {medium}
                </span>
              ))}
              {artist.musical_genres && Array.isArray(artist.musical_genres) && artist.musical_genres.map((genre, index) => (
                <span
                  key={`genre-${index}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Statement Section */}
          {artist.tagline && (
            <div>
              <h4 className="text-gray-700 leading-relaxed text-base whitespace-pre-line mb-8">
                {artist.tagline}
              </h4>
            </div>
          )}

          {/* Social Media Icons */}
          <div className="flex justify-center lg:justify-start gap-3 mb-6">
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                title="Website"
              >
                <Globe size={18} />
              </a>
            )}
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                title="Facebook"
              >
                <Facebook size={18} />
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                title="Instagram"
              >
                <Instagram size={18} />
              </a>
            )}
          </div>

          {/* Message Button */}
          <button
            onClick={() => {
              if (artist.artist_email) {
                window.location.href = `mailto:${artist.artist_email}`
              } else {
                setContactModalOpen(true)
              }
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2.5 px-4 rounded-lg transition-colors mb-8 flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            Message
          </button>

          {/* Desktop Navigation Tabs - Vertical */}
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left py-3 px-4 rounded-lg transition-colors font-medium ${
                  activeTab === tab.id
                    ? 'bg-[#FFCE03] text-black'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile View - Header with horizontal tabs */}
        <div className="lg:hidden">
          {/* Profile Header - Compact */}
          <div className="p-4 pb-0">
            <div className="flex items-center gap-4 mb-4">
              {/* Profile Image - Smaller on mobile */}
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-100 flex-shrink-0">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-2xl font-bold">
                      {artist.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name and Type */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 uppercase mb-1 tracking-tight truncate">
                  {artist.name}
                </h1>
                {artist.artist_type && (
                  <p className="text-sm text-gray-600 mb-2">
                    {artist.artist_type}
                  </p>
                )}

                {/* Visual Mediums / Musical Genres as Tags - Mobile */}
                {(artist.visual_mediums || artist.musical_genres) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {artist.visual_mediums && Array.isArray(artist.visual_mediums) && artist.visual_mediums.map((medium, index) => (
                      <span
                        key={`visual-${index}`}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                      >
                        {medium}
                      </span>
                    ))}
                    {artist.musical_genres && Array.isArray(artist.musical_genres) && artist.musical_genres.map((genre, index) => (
                      <span
                        key={`genre-${index}`}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Social Icons - Mobile */}
                <div className="flex gap-2">
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                      title="Website"
                    >
                      <Globe size={16} />
                    </a>
                  )}
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                      title="Facebook"
                    >
                      <Facebook size={16} />
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                      title="Instagram"
                    >
                      <Instagram size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (artist.artist_email) {
                        window.location.href = `mailto:${artist.artist_email}`
                      } else {
                        setContactModalOpen(true)
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                    title="Message"
                  >
                    <Mail size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tagline - Mobile */}
            {artist.tagline && (
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                {artist.tagline}
              </p>
            )}
          </div>

          {/* Mobile Navigation Tabs - Horizontal Scrollable */}
          <nav className="sticky top-16 bg-white z-10 border-b border-gray-200">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 p-2 min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex-shrink-0 px-5 py-2.5 text-sm font-medium transition-colors rounded-full whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#FFCE03] text-black'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

      {/* Custom CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}