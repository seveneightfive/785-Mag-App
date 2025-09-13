import React, { useState } from 'react'
import { X, DollarSign, Calendar, Link as LinkIcon, Image, Type, FileText } from 'lucide-react'
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
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    background_image: '',
    button_text: '',
    button_link: '',
    start_date: new Date().toISOString().split('T')[0],
    duration: 5
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const price = formData.duration === 5 ? 1000 : 1500 // $10.00 or $15.00 in cents

      const { error } = await supabase
        .from('advertisements')
        .insert({
          title: formData.title,
          content: formData.content,
          background_image: formData.background_image || null,
          button_text: formData.button_text,
          button_link: formData.button_link,
          start_date: formData.start_date,
          duration: formData.duration,
          price: price,
          user_id: user.id
        })

      if (!error) {
        setFormData({
          title: '',
          content: '',
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
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
              placeholder="Enter advertisement title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-2" />
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
              placeholder="Enter advertisement content"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image size={16} className="inline mr-2" />
              Background Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.background_image}
              onChange={(e) => setFormData(prev => ({ ...prev, background_image: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFCE03] focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
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
            <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center relative overflow-hidden">
              {formData.background_image && (
                <img
                  src={formData.background_image}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">
                  {formData.title || 'Your Title Here'}
                </h3>
                <p className="mb-4 opacity-90">
                  {formData.content || 'Your content will appear here...'}
                </p>
                <button className="bg-[#FFCE03] text-black px-6 py-2 rounded-lg font-medium">
                  {formData.button_text || 'Button Text'}
                </button>
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
              disabled={loading || !formData.title || !formData.content || !formData.button_text || !formData.button_link}
              className="px-6 py-3 bg-[#FFCE03] text-black rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating...' : `Create Ad - ${getPrice(formData.duration)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}