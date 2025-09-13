import React, { useState, useEffect } from 'react'
import { Star, ThumbsUp, MessageCircle, Plus, Upload, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Review } from '../lib/supabase'

interface ReviewSectionProps {
  entityType: 'event' | 'artist' | 'venue'
  entityId: string
  createdBy?: string
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ entityType, entityId, createdBy }) => {
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [userHasReviewed, setUserHasReviewed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
    image_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
    if (user) {
      checkUserReview()
    }
  }, [entityType, entityId, user])

  const checkUserReview = async () => {
    if (!user) return

    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('user_id', user.id)
      .single()

    setUserHasReviewed(!!data)
  }

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        profile:profiles(username, full_name, avatar_url)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (data) {
      setReviews(data)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImagePreview(result)
        setNewReview(prev => ({ ...prev, image_url: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setNewReview(prev => ({ ...prev, image_url: '' }))
  }
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          ...newReview
        })

      if (!error) {
        setNewReview({ rating: 5, title: '', content: '', image_url: '' })
        setImagePreview(null)
        setShowForm(false)
        fetchReviews()
        setUserHasReviewed(true)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              size={16}
              className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    )
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  // Don't show write review button if user created the entity or has already reviewed
  const canWriteReview = user && !userHasReviewed && user.id !== createdBy
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Reviews</h3>
          <div className="flex items-center mt-2">
            {renderStars(Math.round(averageRating))}
            <span className="ml-2 text-sm text-gray-600">
              {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
        
        {canWriteReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-pink flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Write Review</span>
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            {renderStars(newReview.rating, true, (rating) => 
              setNewReview(prev => ({ ...prev, rating }))
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Review title (optional)"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
            <textarea
              value={newReview.content}
              onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Share your experience..."
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo (optional)</label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="review-image-upload"
                />
                <label
                  htmlFor="review-image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload an image</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Review preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-pink disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setImagePreview(null)
                setNewReview({ rating: 5, title: '', content: '', image_url: '' })
              }}
              className="btn-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {review.profile?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {review.profile?.full_name || review.profile?.username || 'Anonymous'}
                  </p>
                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {review.title && (
              <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
            )}
            
            {review.image_url && (
              <div className="mb-3">
                <img
                  src={review.image_url}
                  alt="Review"
                  className="w-full max-w-md h-48 object-cover rounded-lg"
                />
              </div>
            )}
            
            {review.content && (
              <p className="text-gray-600">{review.content}</p>
            )}
          </div>
        ))}
        
        {reviews.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </div>
  )
}