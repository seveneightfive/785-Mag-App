import React, { useState, useRef } from 'react'
import { X, DollarSign, Calendar, Link as LinkIcon, Image, Type, FileText, Upload } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface AdvertisementFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AdvertisementForm: React.FC<AdvertisementFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    headline: '',
    ad_copy: '',
    ad_image_url: '',
    background_image: '',
    button_text: '',
    button_link: '',
    start_date: new Date().toISOString().split('T')[0],
    duration: 5
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('advertisements')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('advertisements')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, ad_image_url: publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const price = formData.duration === 5 ? 1000 : 1500

      const { error } = await supabase
        .from('advertisements')
        .insert({
          title: formData.title,
          content: formData.content,
          headline: formData.headline || null,
          ad_copy: formData.ad_copy || null,
          ad_image_url: formData.ad_image_url || null,
          background_image: formData.background_image || null,
          button_text: formData.button_text,
          button_link: formData.button_link,
          start_date: formData.start_date,
          duration: formData.duration,
          price: price,
          payment_status: 'pending',
          status: 'draft',
          user_id: user.id
        })

      if (!error) {
        setFormData({
          title: '',
          content: '',
          headline: '',
          ad_copy: '',
          ad_image_url: '',
          background_image: '',
          button_text: '',
          button_link: '',
          start_date: new Date().toISOString().split('T')[0],
          duration: 5
        })
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error creating advertisement:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPrice = (duration: number) => {
    return duration === 5 ? '$10.00' : '$15.00'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFCE03] to-orange-500 rounded-xl flex items-center justify-center">
              <DollarSign size={20} className="text-black" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Create Advertisement</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Type size={16} className="inline mr-2" />
              Business / Event or Tagline *
            </label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
              placeholder="Enter business name, event, or tagline (max 50 characters)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.headline.length}/50 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-2" />
              Headline *
            </label>
            <textarea
              value={formData.ad_copy}
              onChange={(e) => {
                const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0)
                if (words.length <= 20 || e.target.value.length < formData.ad_copy.length) {
                  setFormData(prev => ({ ...prev, ad_copy: e.target.value }))
                }
              }}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
              placeholder="Enter headline (max 20 words)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.ad_copy.trim().split(/\s+/).filter(w => w.length > 0).length}/20 words
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-2" />
              Additional Content (Optional)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => {
                const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0)
                if (words.length <= 43 || e.target.value.length < formData.content.length) {
                  setFormData(prev => ({ ...prev, content: e.target.value }))
                }
              }}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
              placeholder="Additional description text (max 43 words)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.trim().split(/\s+/).filter(w => w.length > 0).length}/43 words
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image size={16} className="inline mr-2" />
              Ad Image *
            </label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#FFCE03] transition-colors flex flex-col items-center justify-center space-y-2"
              >
                <Upload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload image (Max 5MB)'}
                </span>
              </button>
              {formData.ad_image_url && (
                <div className="relative">
                  <img
                    src={formData.ad_image_url}
                    alt="Ad preview"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, ad_image_url: '' }))}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Button Text *
              </label>
              <input
                type="text"
                value={formData.button_text}
                onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
                placeholder="Learn More"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon size={16} className="inline mr-2" />
                Button Link *
              </label>
              <input
                type="url"
                value={formData.button_link}
                onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
                placeholder="https://example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration & Price *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
              >
                <option value={5}>5 Days - $10.00</option>
                <option value={14}>14 Days - $15.00</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 mb-3">Preview (How it will appear in feed)</h4>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-sm mx-auto">
              <div className="relative aspect-[4/3] bg-gray-200">
                {formData.ad_image_url ? (
                  <img
                    src={formData.ad_image_url}
                    alt="Ad preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Image size={48} />
                  </div>
                )}
                <div className="absolute top-0 left-0 bg-yellow-400 rounded-br-lg px-3 py-2 shadow-sm">
                  <div className="text-xs font-bold text-pink-600 uppercase tracking-wide">
                    Sponsored Love
                  </div>
                </div>
              </div>
              <div className="p-4">
                {formData.headline && (
                  <div className="text-sm font-medium mb-1 uppercase tracking-wide text-pink-600">
                    {formData.headline}
                  </div>
                )}
                <h3 className="font-medium text-lg text-gray-900 mb-2 uppercase">
                  {formData.ad_copy || 'Your ad copy here'}
                </h3>
                {formData.content && (
                  <p className="text-sm text-gray-600 mb-3">
                    {formData.content}
                  </p>
                )}
                {formData.button_text && (
                  <div className="text-sm font-semibold text-blue-600">
                    {formData.button_text} →
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading || !formData.headline || !formData.ad_copy || !formData.ad_image_url || !formData.button_text || !formData.button_link}
              className="px-6 py-3 bg-[#FFCE03] text-black rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating...' : uploading ? 'Uploading Image...' : `Create Ad - ${getPrice(formData.duration)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}