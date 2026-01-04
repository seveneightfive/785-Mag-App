import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ArtistGalleryProps {
  images: string[]
}

export const ArtistGallery: React.FC<ArtistGalleryProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return null
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="w-full">
      {/* Desktop Row View */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="aspect-square overflow-hidden rounded-xl bg-gray-200">
            <img
              src={image}
              alt={`Artist work ${index + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      {/* Mobile Slider View */}
      <div className="md:hidden relative">
        <div className="overflow-hidden rounded-xl bg-gray-200">
          <div className="aspect-square">
            <img
              src={images[currentIndex]}
              alt={`Artist work ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} className="text-gray-900" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={20} className="text-gray-900" />
            </button>

            <div className="flex gap-2 mt-3 justify-center">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? 'w-6 bg-gray-900' : 'w-2 bg-gray-400'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
