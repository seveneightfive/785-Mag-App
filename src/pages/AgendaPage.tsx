import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Clock, MapPin, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { supabase, type Event, type Venue, trackPageView } from '../lib/supabase'

const EVENT_TYPES = ['Art', 'Entertainment', 'Lifestyle', 'Local Flavor', 'Live Music', 'Party For A Cause', 'Community / Cultural', 'Shop Local']

type ViewMode = 'agenda' | 'calendar'

export const AgendaPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVenue, setSelectedVenue] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('agendaViewMode') as ViewMode) || 'agenda'
  })
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const venueDropdownRef = useRef<HTMLDivElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    trackPageView('agenda')
    fetchEvents()
    fetchVenues()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, selectedVenue, selectedCategory, currentDate])

  useEffect(() => {
    localStorage.setItem('agendaViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (venueDropdownRef.current && !venueDropdownRef.current.contains(event.target as Node)) {
        setVenueDropdownOpen(false)
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchEvents = async () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues(*),
        event_artists(artist:artists(*))
      `)
      .gte('start_date', today.toISOString())
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  const fetchVenues = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, slug')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching venues:', error)
    } else {
      setVenues(data || [])
    }
  }

  const filterEvents = () => {
    let filtered = events

    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedVenue !== 'all') {
      filtered = filtered.filter(event => event.venue_id === selectedVenue)
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event =>
        event.event_types?.includes(selectedCategory)
      )
    }

    setFilteredEvents(filtered)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getMonthYearDisplay = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const groupEventsByDate = (events: Event[]) => {
    const grouped: { [key: string]: Event[] } = {}

    events.forEach(event => {
      const eventDate = new Date(event.start_date)
      const dateKey = eventDate.toDateString()

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })

    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        if (a.event_start_time && b.event_start_time) {
          return a.event_start_time.localeCompare(b.event_start_time)
        }
        return 0
      })
    })

    return grouped
  }

  const getEventsForMonth = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate >= startOfMonth && eventDate <= endOfMonth
    })
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const getEventsForDate = (date: Date) => {
    const dateKey = date.toDateString()
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.toDateString() === dateKey
    })
  }

  const groupedEvents = groupEventsByDate(getEventsForMonth())
  const sortedDateKeys = Object.keys(groupedEvents).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  )

  const selectedVenueName = selectedVenue === 'all' ? 'All Venues' : venues.find(v => v.id === selectedVenue)?.name || 'All Venues'
  const selectedCategoryName = selectedCategory === 'all' ? 'All Categories' : selectedCategory

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToToday}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  TODAY
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <h1 className="text-2xl font-semibold text-gray-900">
                  {getMonthYearDisplay()}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'calendar' ? 'bg-black text-white' : 'hover:bg-gray-100'
                  }`}
                  aria-label="Calendar view"
                >
                  <CalendarIcon size={20} />
                </button>
                <button
                  onClick={() => setViewMode('agenda')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'agenda' ? 'bg-black text-white' : 'hover:bg-gray-100'
                  }`}
                  aria-label="Agenda view"
                >
                  <List size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div ref={venueDropdownRef} className="relative lg:w-64">
                <button
                  onClick={() => setVenueDropdownOpen(!venueDropdownOpen)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700 truncate">{selectedVenueName}</span>
                  <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                </button>

                {venueDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedVenue('all')
                        setVenueDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                        selectedVenue === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      All Venues
                    </button>
                    {venues.map(venue => (
                      <button
                        key={venue.id}
                        onClick={() => {
                          setSelectedVenue(venue.id)
                          setVenueDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                          selectedVenue === venue.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                        }`}
                      >
                        {venue.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div ref={categoryDropdownRef} className="relative lg:w-64">
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700 truncate">{selectedCategoryName}</span>
                  <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCategory('all')
                        setCategoryDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                        selectedCategory === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      All Categories
                    </button>
                    {EVENT_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedCategory(type)
                          setCategoryDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                          selectedCategory === type ? 'bg-blue-50 text-blue-700 font-medium' : ''
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'agenda' ? (
            <div className="space-y-6">
              {sortedDateKeys.length > 0 ? (
                sortedDateKeys.map((dateKey) => {
                  const date = new Date(dateKey)
                  const dayNumber = date.getDate()
                  const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })

                  return (
                    <div key={dateKey} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 font-medium">{monthName}</div>
                          <div className="text-4xl font-bold text-blue-600">{dayNumber}</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{dayName}</div>
                          <div className="text-sm text-gray-500">{groupedEvents[dateKey].length} event{groupedEvents[dateKey].length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {groupedEvents[dateKey].map((event) => (
                          <AgendaEventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <CalendarIcon size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          ) : (
            <CalendarView
              currentDate={currentDate}
              events={filteredEvents}
              onDateSelect={(date) => {
                setCurrentDate(date)
                setViewMode('agenda')
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

const AgendaEventCard: React.FC<{ event: Event }> = ({ event }) => {
  const formatTime = () => {
    if (event.event_start_time) {
      try {
        const dummyDate = new Date(`2000-01-01T${event.event_start_time}`)
        if (isNaN(dummyDate.getTime())) {
          return null
        }
        return dummyDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      } catch (error) {
        return null
      }
    }
    return null
  }

  const formattedTime = formatTime()
  const allArtists = event.event_artists || []

  return (
    <Link
      to={`/events/${event.slug}`}
      className="block hover:bg-gray-50 transition-colors"
    >
      <div className="p-6 flex gap-6">
        <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-white opacity-50" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xl text-gray-900 mb-2 font-oswald">
            {event.title}
          </h3>

          <div className="space-y-2 mb-3">
            {formattedTime && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{formattedTime}</span>
                {event.ticket_price ? (
                  <span className="ml-4 text-sm font-semibold text-green-600">
                    ${parseFloat(event.ticket_price.toString()).toFixed(0)}
                  </span>
                ) : (
                  <span className="ml-4 text-sm font-semibold text-green-600">Free</span>
                )}
              </div>
            )}

            {event.venue && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{event.venue.name}</span>
                {event.venue.address && (
                  <span className="text-sm text-gray-500 ml-1">- {event.venue.address}</span>
                )}
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {event.description}
            </p>
          )}

          {allArtists.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allArtists.slice(0, 5).map((eventArtist) => (
                <span
                  key={eventArtist.artist.id}
                  className="text-xs px-3 py-1 rounded-full bg-black text-white"
                >
                  {eventArtist.artist.name}
                </span>
              ))}
              {allArtists.length > 5 && (
                <span className="text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-700">
                  +{allArtists.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

const CalendarView: React.FC<{
  currentDate: Date
  events: Event[]
  onDateSelect: (date: Date) => void
}> = ({ currentDate, events, onDateSelect }) => {
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
