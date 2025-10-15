import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, X, Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { EventCard } from '../components/EventCard'
import { EventDetailPanel } from '../components/EventDetailPanel'
import { supabase, type Event, trackPageView } from '../lib/supabase'

const EVENT_TYPES = ['Art', 'Entertainment', 'Lifestyle', 'Local Flavor', 'Live Music', 'Party For A Cause', 'Community / Cultural', 'Shop Local']

export const EventsDirectoryPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedEventSlug, setSelectedEventSlug] = useState<string | null>(null)
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({
    all: 0,
    today: 0,
    week: 0,
    month: 0
  })

  useEffect(() => {
    trackPageView('events-directory')
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEvents()
    calculateEventCounts()
  }, [events, searchQuery, selectedTypes, dateFilter])

  useEffect(() => {
    // Auto-select first event on desktop when events are loaded
    if (filteredEvents.length > 0 && !selectedEventSlug) {
      setSelectedEventSlug(filteredEvents[0].slug || null)
    }
  }, [filteredEvents])

  const fetchEvents = async () => {
    // Get current date in local timezone, start of today
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

  const calculateEventCounts = () => {
    // Use local timezone for date calculations
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())

    let baseEvents = events

    // Apply search and type filters first
    if (searchQuery) {
      baseEvents = baseEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_artists?.some(ea => 
          ea.artist.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    if (selectedTypes.length > 0) {
      baseEvents = baseEvents.filter(event =>
        event.event_types?.some(type => selectedTypes.includes(type))
      )
    }

    const counts = {
      all: baseEvents.length,
      today: baseEvents.filter(event => {
        const eventDate = new Date(event.start_date)
        return eventDate >= today && eventDate < tomorrow
      }).length,
      week: baseEvents.filter(event => {
        const eventDate = new Date(event.start_date)
        return eventDate >= today && eventDate < weekFromNow
      }).length,
      month: baseEvents.filter(event => {
        const eventDate = new Date(event.start_date)
        return eventDate >= today && eventDate < monthFromNow
      }).length
    }

    setEventCounts(counts)
  }

  const filterEvents = () => {
    let filtered = events

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_artists?.some(ea => 
          ea.artist.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(event =>
        event.event_types?.some(type => selectedTypes.includes(type))
      )
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_date)
        
        switch (dateFilter) {
          case 'today':
            return eventDate >= today && eventDate < tomorrow
          case 'week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            return eventDate >= today && eventDate < weekFromNow
          case 'month':
            const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
            return eventDate >= today && eventDate < monthFromNow
          default:
            return true
        }
      })
    }

    setFilteredEvents(filtered)
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setDateFilter('all')
    setSearchQuery('')
  }

  const activeFiltersCount = selectedTypes.length + (dateFilter !== 'all' ? 1 : 0)

  // Group events by date for mobile view
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
    
    // Sort events within each date by start time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      )
    })
    
    return grouped
  }

  const groupedEvents = groupEventsByDate(filteredEvents)
  const sortedDateKeys = Object.keys(groupedEvents).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C80650]"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg flex-shrink-0"
              >
                <Filter size={16} />
                <span className="text-sm">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="text-white text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#C80650' }}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Filter Modal - Full Screen */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <h3 className="text-2xl font-bold font-oswald text-gray-900">FILTERS</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close filters"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 pb-32">
                {/* Date Filter */}
                <div className="mb-8">
                  <h4 className="font-bold font-oswald text-gray-900 mb-4 text-lg">WHEN</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'all', label: 'All Upcoming', count: eventCounts.all },
                      { value: 'today', label: 'Today', count: eventCounts.today },
                      { value: 'week', label: 'This Week', count: eventCounts.week },
                      { value: 'month', label: 'This Month', count: eventCounts.month }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDateFilter(option.value as any)}
                        className={`btn-filter transition-colors ${
                          dateFilter === option.value
                            ? 'active'
                            : ''
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs opacity-75">{option.count} events</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Types Filter */}
                <div className="mb-8">
                  <h4 className="font-bold font-oswald text-gray-900 mb-4 text-lg">EVENT TYPES</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {EVENT_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={`btn-filter transition-colors ${
                          selectedTypes.includes(type)
                            ? 'active'
                            : ''
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Button */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full btn-pink py-4 text-lg font-bold"
                >
                  View {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layout - Sidebar + Content */}
        <div className="hidden lg:flex h-screen">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto">
            <div className="p-6">
              {/* Header with Search and Clear */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold font-oswald text-gray-900 mb-2">Events Directory</h1>
                <p className="text-sm text-gray-600 mb-4">Discover amazing upcoming events</p>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C80650]"
                  />
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                  >
                    <X size={12} />
                    <span>Clear all filters</span>
                  </button>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold font-oswald text-gray-900 text-base">FILTERS</h3>
                  {activeFiltersCount > 0 && (
                    <span className="text-white text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#C80650' }}>
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Date Filter */}
              <div className="mb-6">
                <h4 className="font-bold font-oswald text-gray-900 mb-3 text-sm">WHEN</h4>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Upcoming', count: eventCounts.all },
                    { value: 'today', label: 'Today', count: eventCounts.today },
                    { value: 'week', label: 'This Week', count: eventCounts.week },
                    { value: 'month', label: 'This Month', count: eventCounts.month }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateFilter(option.value as any)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        dateFilter === option.value
                          ? 'bg-black text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{option.label}</span>
                        <span className="text-xs opacity-75">({option.count})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Types Filter */}
              <div className="mb-6">
                <h4 className="font-bold font-oswald text-gray-900 mb-3 text-sm">EVENT TYPES</h4>
                <div className="space-y-2">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedTypes.includes(type)
                          ? 'bg-black text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6">
              {/* Results Count */}
              <div className="mb-4">
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} found`}
                </p>
              </div>

            {/* Events Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#C80650' }}></div>
              </div>
            ) : (
              <>
                {filteredEvents.length > 0 ? (
                  <div className="grid grid-cols-3 gap-8 h-[calc(100vh-300px)]">
                    {/* Left Panel - Event List */}
                    <div className="col-span-2 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-6 pr-6">
                        {filteredEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`rounded-xl transition-all ${
                              selectedEventSlug === event.slug
                                ? 'ring-2 ring-blue-500 shadow-lg'
                                : ''
                            }`}
                          >
                            <EventCard
                              event={event}
                              onSelect={setSelectedEventSlug}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Panel - Event Details */}
                    <div className="col-span-1 overflow-y-auto">
                      <EventDetailPanel eventSlug={selectedEventSlug} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-600">Try adjusting your search or filters</p>
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        </div>

        {/* Mobile Layout - Date Grouped */}
        <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6 pb-24">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#C80650' }}></div>
              </div>
            ) : filteredEvents.length > 0 ? (
              sortedDateKeys.map((dateKey) => {
                const date = new Date(dateKey)
                const dayNumber = date.getDate()
                const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()

                return (
                  <div key={dateKey} className="space-y-3">
                    {/* Date Header */}
                    <div className="sticky top-20 z-30 bg-white shadow-sm flex items-center space-x-4 px-4 py-3">
                      <div className="text-center">
                        <div className="text-sm text-gray-700 font-medium">{monthName}</div>
                        <div className="text-3xl font-bold" style={{ color: '#C80650' }}>{dayNumber}</div>
                      </div>
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <div className="text-sm text-gray-500 font-medium">
                        <span className="font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Events for this date */}
                    <div className="space-y-3">
                      {groupedEvents[dateKey].map((event) => (
                        <MobileEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Mobile Event Card Component with horizontal layout
const MobileEventCard: React.FC<{ event: Event }> = ({ event }) => {
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

  const formatEventDate = () => {
    try {
      const eventDate = new Date(event.start_date)
      if (isNaN(eventDate.getTime())) {
        return 'Invalid Date'
      }
      return eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const formattedTime = formatTime()
  const formattedDate = formatEventDate()

  const allArtists = event.event_artists || []

  return (
    <Link 
      to={`/events/${event.slug}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden mx-2"
    >
      <div className="flex">
        {/* Event Image - 16:9 aspect ratio */}
        <div className="w-32 h-20 bg-gray-200 overflow-hidden flex-shrink-0">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="flex-1 p-2 min-w-0">
          {/* Event Title */}
          <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-1 font-oswald">
            {event.title}
          </h3>

          {/* Time (if available) and Venue */}
          <div className="space-y-1 text-xs text-gray-600">
            {formattedTime && (
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>{formattedTime}</span>
              </div>
            )}
            
            {event.venue && (
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{event.venue.name}</span>
              </div>
            )}
          </div>

          {/* Artists */}
          {allArtists.length > 0 && (
            <div className="mt-1">
              <div className="flex flex-wrap gap-1">
                {allArtists.slice(0, 2).map((eventArtist) => (
                  <span
                    key={eventArtist.artist.id}
                    className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800"
                  >
                    {eventArtist.artist.name}
                  </span>
                ))}
                {allArtists.length > 2 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    +{allArtists.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}