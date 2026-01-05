import React, { useState } from 'react'
import { Building2, Calendar, ChevronDown, ChevronUp, Eye, Pencil } from 'lucide-react'
import { ImageWithFallback } from './ImageWithFallback'
import { EditableEventRow } from './EditableEventRow'
import { type Organizer, type Event } from '../lib/supabase'

interface OrganizerManagementCardProps {
  organizer: Organizer
  events: Event[]
  onEventUpdate: () => void
  canEditEvent: (event: Event) => boolean
}

export const OrganizerManagementCard: React.FC<OrganizerManagementCardProps> = ({
  organizer,
  events,
  onEventUpdate,
  canEditEvent
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const upcomingEvents = events.filter(
    (e) => new Date(e.start_date) >= new Date()
  ).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  const pastEvents = events.filter(
    (e) => new Date(e.start_date) < new Date()
  ).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
            {organizer.logo ? (
              <img
                src={organizer.logo}
                alt={organizer.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <Building2 size={32} className="text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {organizer.name}
            </h3>

            {organizer.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {organizer.description}
              </p>
            )}

            <div className="flex items-center space-x-3">
              <a
                href={`/organizers/${organizer.slug}`}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                <Eye size={14} />
                <span>View</span>
              </a>

              {events.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <Calendar size={14} />
                  <span>{events.length} event{events.length !== 1 ? 's' : ''}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {isExpanded && events.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {upcomingEvents.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Upcoming Events ({upcomingEvents.length})</span>
                </h4>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <EditableEventRow
                      key={event.id}
                      event={event}
                      canEdit={canEditEvent(event)}
                      onUpdate={onEventUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3 flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Past Events ({pastEvents.length})</span>
                </h4>
                <div className="space-y-2 opacity-60">
                  {pastEvents.slice(0, 5).map((event) => (
                    <EditableEventRow
                      key={event.id}
                      event={event}
                      canEdit={canEditEvent(event)}
                      onUpdate={onEventUpdate}
                    />
                  ))}
                  {pastEvents.length > 5 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      and {pastEvents.length - 5} more past events
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {events.length === 0 && (
          <div className="mt-4 text-center py-6 text-gray-400 text-sm">
            No events organized yet
          </div>
        )}
      </div>
    </div>
  )
}
