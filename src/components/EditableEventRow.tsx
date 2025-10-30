import React, { useState } from 'react'
import { Calendar, Clock, DollarSign, Users, Edit2, Save, X, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, type Event } from '../lib/supabase'

interface EditableEventRowProps {
  event: Event
  canEdit: boolean
  onUpdate: () => void
}

export const EditableEventRow: React.FC<EditableEventRowProps> = ({ event, canEdit, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    start_date: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : '',
    event_start_time: event.event_start_time || '',
    event_end_time: event.event_end_time || '',
    ticket_price: event.ticket_price?.toString() || '',
    ticket_url: event.ticket_url || '',
    capacity: event.capacity?.toString() || ''
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData({
      title: event.title || '',
      description: event.description || '',
      start_date: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : '',
      event_start_time: event.event_start_time || '',
      event_end_time: event.event_end_time || '',
      ticket_price: event.ticket_price?.toString() || '',
      ticket_url: event.ticket_url || '',
      capacity: event.capacity?.toString() || ''
    })
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.start_date) {
      alert('Title and start date are required')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description || null,
          start_date: formData.start_date,
          event_start_time: formData.event_start_time || null,
          event_end_time: formData.event_end_time || null,
          ticket_price: formData.ticket_price ? parseFloat(formData.ticket_price) : null,
          ticket_url: formData.ticket_url || null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id)

      if (error) throw error

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Failed to update event. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (isEditing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Event title"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="text"
              value={formData.event_start_time}
              onChange={(e) => setFormData({ ...formData, event_start_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="7:00 PM"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="text"
              value={formData.event_end_time}
              onChange={(e) => setFormData({ ...formData, event_end_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10:00 PM"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ticket Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.ticket_price}
              onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Capacity
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Event description"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Ticket URL
          </label>
          <input
            type="url"
            value={formData.ticket_url}
            onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://..."
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-1"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#FFCE03] hover:bg-[#E5B902] rounded-lg disabled:opacity-50 flex items-center space-x-1"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <Link
              to={`/events/${event.slug}`}
              className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {event.title}
            </Link>
            {event.slug && (
              <Link
                to={`/events/${event.slug}`}
                target="_blank"
                className="text-gray-400 hover:text-blue-600"
                title="View event page"
              >
                <ExternalLink size={14} />
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>{formatDate(event.start_date)}</span>
            </div>

            {event.event_start_time && (
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{event.event_start_time}</span>
                {event.event_end_time && <span> - {event.event_end_time}</span>}
              </div>
            )}

            {event.ticket_price && (
              <div className="flex items-center space-x-1">
                <DollarSign size={14} />
                <span>${event.ticket_price}</span>
              </div>
            )}

            {event.capacity && (
              <div className="flex items-center space-x-1">
                <Users size={14} />
                <span>{event.capacity}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
          )}
        </div>

        {canEdit && (
          <button
            onClick={handleEdit}
            className="ml-4 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
            title="Edit event"
          >
            <Edit2 size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
