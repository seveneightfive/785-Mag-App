import React, { useState, useEffect } from 'react'
import { ExternalLink, Eye } from 'lucide-react'
import { supabase, type Advertisement } from '../lib/supabase'

export const AdvertisementBanner: React.FC = () => {
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageOrientation, setImageOrientation] = useState<'horizontal' | 'vertical' | null>(null)

  useEffect(() => {
    fetchActiveAdvertisement()
  }, [])

  const fetchActiveAdvertisement = async () => {
    try {
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .lte('start_date', new Date().toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setAdvertisement(data[0])
        // Track view
        await supabase
          .from('advertisements')
          .update({ views: data[0].views + 1 })
          .eq('id', data[0].id)

        // Determine image orientation if background image exists
        if (data[0].background_image) {
          const img = new Image()
          img.onload = () => {
            setImageOrientation(img.width > img.height ? 'horizontal' : 'vertical')
          }
          img.src = data[0].background_image
        }
      }
    } catch (error) {
      // No active ads or error - this is fine
      console.log('No active advertisements')
    } finally {
      setLoading(false)
    }
  }

  const handleClick = async () => {
    if (!advertisement) return

    // Track click
    await supabase
      .from('advertisements')
      .update({ clicks: advertisement.clicks + 1 })
      .eq('id', advertisement.id)

    // Open link
    window.open(advertisement.button_link, '_blank')
  }

  const trackView = async () => {
    if (!advertisement) return

    await supabase
      .from('advertisements')
      .update({ views: advertisement.views + 1 })
      .eq('id', advertisement.id)
  }

  if (loading || !advertisement) {
    return null
  }

  // Determine layout and colors based on image orientation
  const isVertical = imageOrientation === 'vertical'
  const backgroundClass = isVertical 
    ? 'bg-[#FFCE03]' 
    : 'bg-gradient-to-r from-blue-600 to-cyan-400'
  const textColor = isVertical ? 'text-black' : 'text-white'
  const buttonClass = isVertical 
    ? 'bg-black text-white hover:bg-gray-800' 
    : 'bg-white text-black hover:bg-gray-100'

  return (
    <section className={`${backgroundClass} rounded-2xl overflow-hidden relative`}>
      <div className={`grid ${isVertical ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'} min-h-[300px]`}>
        {/* Content Section */}
        <div className={`p-8 lg:p-12 flex flex-col justify-center ${isVertical ? 'order-2 lg:order-1' : 'order-1'}`}>
          <h2 className={`text-3xl lg:text-4xl font-bold font-oswald mb-4 ${textColor} uppercase tracking-wide`}>
            {advertisement.title}
          </h2>
          <p className={`text-lg mb-8 ${textColor} ${isVertical ? 'opacity-80' : 'opacity-90'} font-outfit leading-relaxed`}>
            {advertisement.content}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleClick}
              className={`${buttonClass} px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center space-x-2 font-outfit uppercase tracking-wide`}
            >
              <span>{advertisement.button_text}</span>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* Image Section */}
        {advertisement.background_image && (
          <div className={`relative ${isVertical ? 'order-1 lg:order-2' : 'order-2'} min-h-[200px] lg:min-h-[300px]`}>
            <img
              src={advertisement.background_image}
              alt="Advertisement background"
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={trackView}
            />
            {/* Overlay for better text readability if needed */}
            {!isVertical && (
              <div className="absolute inset-0 bg-black/10"></div>
            )}
          </div>
        )}
      </div>

      {/* Sponsored indicator */}
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
        <span className={`text-xs font-medium ${isVertical ? 'text-black/70' : 'text-white/75'} font-outfit`}>Sponsored</span>
      </div>
    </section>
  )
}