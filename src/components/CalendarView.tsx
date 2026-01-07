import React from 'react'
import { type Event } from '../lib/supabase'

interface CalendarViewProps {
  currentDate: Date
  events: Event[]
  onDateSelect: (date: Date) => void
}

function getDaysInMonth(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  return { daysInMonth, startingDayOfWeek }
}

function getEventsForDate(events: Event[], date: Date) {
  const dateKey = date.toDateString()
  return events.filter(event => {
    const eventDate = new Date(event.start_date)
    return eventDate.toDateString() === dateKey
  })
}

function isSameDay(date1: Date, date2: Date) {
  return date1.toDateString() === date2.toDateString()
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  events,
  onDateSelect
}) => {
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateEvents = getEventsForDate(events, date)
    const isToday = isSameDay(date, new Date())
    const hasEvents = dateEvents.length > 0

    days.push(
      <button
        key={day}
        onClick={() => hasEvents && onDateSelect(date)}
        className={`aspect-square p-2 border border-gray-200 hover:bg-gray-50 transition-colors ${
          isToday ? 'bg-blue-50 border-blue-300' : ''
        } ${hasEvents ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex flex-col h-full">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </span>
          {hasEvents && (
            <div className="mt-1 flex-1 overflow-hidden">
              <div className="space-y-1">
                {dateEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                  >
                    {event.title}
                  </div>
                ))}
                {dateEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dateEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  )
}
