import React, { useState, useEffect } from 'react'
import { X, Calendar, Link as LinkIcon, Megaphone } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Event, type Artist, type Venue } from '../lib/supabase'

interface AnnouncementFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    entity_type: '',
    entity_id: '',
    expires_in: 10,
    learnmore_link: '',
    priority: 1
  })
  const [entities, setEntities] = useState<{
    events: Event[]
    artists: Artist[]
    venues: Venue[]
  }>({
    events: [],
    artists: [],
    venues: []
  })

  useEffect(() => {
    if (isOpen) {
      fetchEntities()
    }
  }, [isOpen])

  const fetchEntities = async () => {
    const [eventsData, artistsData, venuesData] = await Promise.all([
      supabase.from('events').select('id, title, slug').order('title'),
      supabase.from('artists').select('id, name, slug').order('name'),
      supabase.from('venues').select('id, name, slug').order('name')
    ])

    setEntities({
      events: eventsData.data || [],
      artists: artistsData.data || [],
      venues: venuesData.data || []
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + formData.expires_in)

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: formData.title,
          content: formData.content,
          entity_type: formData.entity_type || null,
          entity_id: formData.entity_id || null,
          expires_in: formData.expires_in,
          expires_at: expiresAt.toISOString(),
          learnmore_link: formData.learnmore_link || null,
          priority: formData.priority,
          active: true,
          created_by: user.id
        })

      if (!error) {
        setFormData({
          title: '',
          content: '',
          entity_type: '',
          entity_id: '',
          expires_in: 10,
          learnmore_link: '',
          priority: 1
        })
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEntityOptions = () => {
    switch (formData.entity_type) {
      case 'event':
        return entities.events.map(event => ({ id: event.id, name: event.title }))
      case 'artist':
        return entities.artists.map(artist => ({ id: artist.id, name: artist.name }))
      case 'venue':
        return entities.venues.map(venue => ({ id: venue.id, name: venue.name }))
      default:
        return []
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C80650] to-purple-600 rounded-xl flex items-center justify-center">
              <Megaphone size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Create Announcement</h2>
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
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C80650] focus:border-transparent"
              placeholder="Enter announcement title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C80650] focus:border-transparent"
              placeholder="Enter announcement content"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires In (Days)
              </label>
              <input
                type="number"
                value={formData.expires_in}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_in: parseInt(e.target.value) || 10 }))}
                min="1"
                max="365"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C80650] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C80650] focus:border-transparent"
              >
                <option value={1}>Normal</option>
                <option value={2}>High</option>
                <option value={3}>Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learn More Link (Optional)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="url"
                value={formData.learnmore_link}
                onChange={(e) => setFormData(prev => ({ ...prev, learnmore_link: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C80650] focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link to Entity (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.entity_type}
                onChange={(e) => setFormData(prev => ({ ...prev, entity_type: e.target.value, entity_id: '' }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C80650] focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="event">Event</option>
                <option value="artist">Artist</option>
                <option value="venue">Venue</option>
              </select>

              {formData.entity_type && (
                <select
                  value={formData.entity_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, entity_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C80650] focus:border-transparent"
                >
                  <option value="">Select {formData.entity_type}</option>
                  {getEntityOptions().map(entity => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              )}
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
              disabled={loading || !formData.title || !formData.content}
              className="px-6 py-3 bg-[#C80650] text-white rounded-xl hover:bg-[#A0052E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}