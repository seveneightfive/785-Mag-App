import React, { useState, useEffect } from 'react'
import { Search, Filter, MapPin, X, ArrowUpDown, ChevronLeft, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { VenueCard } from '../components/VenueCard'
import { supabase, type Venue, trackPageView } from '../lib/supabase'
import { ImageWithFallback } from '../components/ImageWithFallback'

const VENUE_TYPES = ['Gallery / Museum', 'Live Music', 'Bar/Tavern', 'Shop Local', 'Local Flavor', 'Event Space', 'Brewery/Winery', 'Outdoor Space', 'Theatre', 'Studio / Classes', 'Community Space', 'First Friday ArtWalk', 'Coffee Shop', 'Church', 'Experiences', 'Trades + Services']
const NEIGHBORHOODS = ['Downtown', 'NOTO', 'North Topeka', 'Oakland', 'Westboro Mart', 'College Hill', 'Lake Shawnee', 'Golden Mile', 'A Short Drive', 'South Topeka', 'Midtown', 'West Topeka']

type SortOption = 'alphabetical-asc' | 'alphabetical-desc' | 'events-desc'
type FilterStep = 'main' | 'venue-types' | 'neighborhoods'

export const VenuesDirectoryPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([])
  const [venuesWithEventCounts, setVenuesWithEventCounts] = useState<(Venue & { eventCount: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical-asc')
  const [neighborhoodCounts, setNeighborhoodCounts] = useState<Record<string, number>>({})
  const [filterStep, setFilterStep] = useState<FilterStep>('main')
  const [venueTypeCounts, setVenueTypeCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    trackPageView('venues-directory')
    fetchVenues()
  }, [])

  useEffect(() => {
    filterAndSortVenues()
  }, [venues, venuesWithEventCounts, searchQuery, selectedTypes, selectedNeighborhoods, sortBy])

  useEffect(() => {
    calculateNeighborhoodCounts()
    calculateVenueTypeCounts()
  }, [venues, searchQuery, selectedTypes])

  const fetchVenues = async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('venues')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) {
        console.error('Error fetching venues:', fetchError)
        setError('Failed to load venues. Please try refreshing the page.')
      } else {
        const venuesData = data || []
        setVenues(venuesData)
        await fetchEventCounts(venuesData)
      }
    } catch (err) {
      console.error('Unexpected error fetching venues:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchEventCounts = async (venuesData: Venue[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const venuesWithCounts = await Promise.all(
      venuesData.map(async (venue) => {
        const { count } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('venue_id', venue.id)
          .gte('start_date', today.toISOString())

        return {
          ...venue,
          eventCount: count || 0
        }
      })
    )
    setVenuesWithEventCounts(venuesWithCounts)
  }

  const calculateNeighborhoodCounts = () => {
    let baseVenues = venues

    // Apply search and type filters first
    if (searchQuery) {
      baseVenues = baseVenues.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedTypes.length > 0) {
      baseVenues = baseVenues.filter(venue =>
        selectedTypes.includes(venue.venue_type)
      )
    }

    const counts: Record<string, number> = {}
    NEIGHBORHOODS.forEach(neighborhood => {
      counts[neighborhood] = baseVenues.filter(venue => 
        venue.neighborhood === neighborhood
      ).length
    })

    setNeighborhoodCounts(counts)
  }

  const calculateVenueTypeCounts = () => {
    let baseVenues = venues

    // Apply search and neighborhood filters first
    if (searchQuery) {
      baseVenues = baseVenues.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedNeighborhoods.length > 0) {
      baseVenues = baseVenues.filter(venue =>
        venue.neighborhood && selectedNeighborhoods.includes(venue.neighborhood)
      )
    }

    const counts: Record<string, number> = {}
    VENUE_TYPES.forEach(type => {
      counts[type] = baseVenues.filter(venue => venue.venue_type === type).length
    })

    setVenueTypeCounts(counts)
  }

  const filterAndSortVenues = () => {
    let filtered = venues

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(venue =>
        selectedTypes.includes(venue.venue_type)
      )
    }

    // Neighborhood filter
    if (selectedNeighborhoods.length > 0) {
      filtered = filtered.filter(venue =>
        venue.neighborhood && selectedNeighborhoods.includes(venue.neighborhood)
      )
    }

    // Apply sorting with event counts
    const filteredWithCounts = filtered.map(venue => {
      const venueWithCount = venuesWithEventCounts.find(v => v.id === venue.id)
      return {
        ...venue,
        eventCount: venueWithCount?.eventCount || 0
      }
    })

    // Sort by upcoming events count (descending), then by name (ascending)
    filteredWithCounts.sort((a, b) => {
      if (b.eventCount !== a.eventCount) {
        return b.eventCount - a.eventCount
      }
      return a.name.localeCompare(b.name)
    })

    // Apply additional sorting based on sortBy option
    if (sortBy === 'alphabetical-desc') {
      // For alphabetical desc, we still want events first, but reverse the name order for venues with same event count
      filteredWithCounts.sort((a, b) => {
        if (b.eventCount !== a.eventCount) {
          return b.eventCount - a.eventCount
        }
        return b.name.localeCompare(a.name)
      })
    }

    setFilteredVenues(filteredWithCounts)
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleNeighborhood = (neighborhood: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setSelectedNeighborhoods([])
    setSearchQuery('')
    setSortBy('alphabetical-asc')
    setFilterStep('main')
  }

  const activeFiltersCount = selectedTypes.length + selectedNeighborhoods.length + (sortBy !== 'alphabetical-asc' ? 1 : 0)

  const renderFilterContent = () => {
    switch (filterStep) {
      case 'main':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Choose Filter Type</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setFilterStep('venue-types')}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Venue Types</h4>
                  <p className="text-sm text-gray-600">Filter by type of venue</p>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedTypes.length > 0 && `${selectedTypes.length} selected`}
                </div>
              </button>
              <button
                onClick={() => setFilterStep('neighborhoods')}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Neighborhoods</h4>
                  <p className="text-sm text-gray-600">Filter by location</p>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedNeighborhoods.length > 0 && `${selectedNeighborhoods.length} selected`}
                </div>
              </button>
            </div>
          </div>
        )
      
      case 'venue-types':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setFilterStep('main')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">Venue Types</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {/* All option */}
              <button
                onClick={() => setSelectedTypes([])}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedTypes.length === 0
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">All</div>
                <div className="text-sm opacity-75">
                  {Object.values(venueTypeCounts).reduce((sum, count) => sum + count, 0)} venues
                </div>
              </button>
              {VENUE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedTypes.includes(type)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{type}</div>
                  <div className="text-sm opacity-75">{venueTypeCounts[type] || 0} venues</div>
                </button>
              ))}
            </div>
          </div>
        )
      
      case 'neighborhoods':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setFilterStep('main')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">Neighborhoods</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {/* All option */}
              <button
                onClick={() => setSelectedNeighborhoods([])}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedNeighborhoods.length === 0
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">All</div>
                <div className="text-sm opacity-75">
                  {Object.values(neighborhoodCounts).reduce((sum, count) => sum + count, 0)} venues
                </div>
              </button>
              {NEIGHBORHOODS.map((neighborhood) => (
                <button
                  key={neighborhood}
                  onClick={() => toggleNeighborhood(neighborhood)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedNeighborhoods.includes(neighborhood)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{neighborhood}</div>
                  <div className="text-sm opacity-75">{neighborhoodCounts[neighborhood] || 0} venues</div>
                </button>
              ))}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Layout>
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
                placeholder="Search venues..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg flex-shrink-0"
              onMouseDown={() => setFilterStep('main')}
            >
              <Filter size={16} />
              <span className="text-sm">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFilters(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 pb-24">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  {renderFilterContent()}
                </div>
                <button
                  onClick={() => {
                    setShowFilters(false)
                    setFilterStep('main')
                  }}
                  className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filter Drawer */}
      {showFilters && (
        <div className="hidden lg:block fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFilters(false)}></div>
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl max-w-5xl w-full max-h-[75vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold font-urbanist text-gray-900 uppercase mb-2">Filter Venues</h2>
                  <p className="text-sm text-gray-600">Select venue types and neighborhoods to refine your search</p>
                </div>
                <button
                  onClick={() => {
                    setShowFilters(false)
                    setFilterStep('main')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Venue Types Section */}
                <div>
                  <h3 className="font-bold font-urbanist text-gray-900 mb-4 text-lg">VENUE TYPES</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    <button
                      onClick={() => setSelectedTypes([])}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                        selectedTypes.length === 0
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">All Venue Types</span>
                        <span className="text-sm opacity-75">
                          {Object.values(venueTypeCounts).reduce((sum, count) => sum + count, 0)}
                        </span>
                      </div>
                    </button>
                    {VENUE_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                          selectedTypes.includes(type)
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{type}</span>
                          <span className="text-sm opacity-75">{venueTypeCounts[type] || 0}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Neighborhoods Section */}
                <div>
                  <h3 className="font-bold font-urbanist text-gray-900 mb-4 text-lg">NEIGHBORHOODS</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    <button
                      onClick={() => setSelectedNeighborhoods([])}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                        selectedNeighborhoods.length === 0
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">All Neighborhoods</span>
                        <span className="text-sm opacity-75">
                          {Object.values(neighborhoodCounts).reduce((sum, count) => sum + count, 0)}
                        </span>
                      </div>
                    </button>
                    {NEIGHBORHOODS.map((neighborhood) => (
                      <button
                        key={neighborhood}
                        onClick={() => toggleNeighborhood(neighborhood)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                          selectedNeighborhoods.includes(neighborhood)
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{neighborhood}</span>
                          <span className="text-sm opacity-75">{neighborhoodCounts[neighborhood] || 0}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
                >
                  <X size={16} />
                  <span>Clear all filters</span>
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false)
                    setFilterStep('main')
                  }}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Layout - Top Bar + Content */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        {/* Top Bar - Header and Search */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold font-urbanist text-gray-900 uppercase">Venues Directory</h1>
                <p className="text-sm text-gray-600 mt-1">Discover amazing local venues</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {loading ? 'Loading...' : `${filteredVenues.length} venue${filteredVenues.length !== 1 ? 's' : ''} found`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search venues..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gray-100 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <Filter size={18} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1 px-4 py-3"
                >
                  <X size={16} />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Venues</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setLoading(true)
                    fetchVenues()
                  }}
                  className="btn-black"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {filteredVenues.length > 0 ? (
                <div className="space-y-3">
                  {filteredVenues.map((venue) => (
                    <DesktopVenueCard key={venue.id} venue={venue} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Layout - List View */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-3 pb-24">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Venues</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setLoading(true)
                    fetchVenues()
                  }}
                  className="btn-black"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredVenues.length > 0 ? (
            filteredVenues.map((venue) => (
              <MobileVenueCard key={venue.id} venue={venue} />
            ))
          ) : (
            <div className="text-center py-12">
              <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

// Desktop Venue Card Component with horizontal layout
const DesktopVenueCard: React.FC<{ venue: Venue }> = ({ venue }) => {
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0)
  const [logoAspectRatio, setLogoAspectRatio] = useState<number>(1)

  useEffect(() => {
    fetchUpcomingEventsCount()
  }, [venue.id])

  const fetchUpcomingEventsCount = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venue.id)
      .gte('start_date', today.toISOString())

    setUpcomingEventsCount(count || 0)
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setLogoAspectRatio(img.naturalWidth / img.naturalHeight)
  }

  const streetAddress = venue.address?.split(',')[0]?.trim() || 'Address not available'

  return (
    <Link
      to={`/venues/${venue.slug}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative group"
    >
      {/* Event Count Badge */}
      {upcomingEventsCount > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-black text-base font-bold shadow-lg"
            style={{ backgroundColor: '#FFCE03' }}
          >
            {upcomingEventsCount}
          </div>
        </div>
      )}

      <div className="flex items-center p-6">
        {/* Venue Image */}
        <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
          <ImageWithFallback
            src={venue.logo || venue.image_url}
            alt={venue.name}
            className="w-full h-full object-contain p-4"
            fallbackType="venue"
            onLoad={handleImageLoad}
          />
        </div>

        {/* Venue Details */}
        <div className="flex-1 px-6 min-w-0">
          {/* Venue Name */}
          <h3 className="font-urbanist text-2xl font-extrabold text-gray-900 mb-2 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
            {venue.name.toUpperCase()}
          </h3>

          {/* Venue Type */}
          {venue.venue_type && (
            <div className="inline-block mb-3">
              <span className="px-3 py-1 bg-black text-white text-sm rounded-full">
                {venue.venue_type}
              </span>
            </div>
          )}

          {/* Address and Neighborhood */}
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center space-x-2">
              <MapPin size={18} className="flex-shrink-0" />
              <span className="text-base">{streetAddress}</span>
            </div>

            {venue.neighborhood && (
              <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                {venue.neighborhood}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// Mobile Venue Card Component with horizontal list layout
const MobileVenueCard: React.FC<{ venue: Venue }> = ({ venue }) => {
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0)
  const [logoAspectRatio, setLogoAspectRatio] = useState<number>(1)

  useEffect(() => {
    fetchUpcomingEventsCount()
  }, [venue.id])

  const fetchUpcomingEventsCount = async () => {
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venue.id)
      .gte('start_date', new Date().toISOString())

    setUpcomingEventsCount(count || 0)
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setLogoAspectRatio(img.naturalWidth / img.naturalHeight)
  }

  const streetAddress = venue.address?.split(',')[0]?.trim() || 'Address not available'

  return (
    <Link
      to={`/venues/${venue.slug}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden mx-2 relative"
    >
      {/* Event Count Badge - Top Right */}
      {upcomingEventsCount > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-black text-xs font-bold shadow-lg"
            style={{ backgroundColor: '#FFCE03' }}
          >
            {upcomingEventsCount}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Venue Image */}
        <div className="w-32 h-32 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
          <ImageWithFallback
            src={venue.logo || venue.image_url}
            alt={venue.name}
            className="w-full h-full object-contain p-2"
            fallbackType="venue"
            onLoad={handleImageLoad}
          />
        </div>

        {/* Venue Details */}
        <div className="flex-1 p-3 min-w-0">
          {/* Venue Name */}
          <h3 className="font-urbanist text-base font-medium text-gray-900 mb-1 line-clamp-1 uppercase tracking-wide">
            {venue.name.toUpperCase()}
          </h3>

          {/* Venue Type */}
          {venue.venue_type && (
            <div className="text-xs text-gray-600 mb-2">
              {venue.venue_type}
            </div>
          )}

          {/* Address */}
          <div className="flex items-start space-x-1.5 text-gray-600">
            <MapPin size={12} className="mt-0.5 flex-shrink-0" />
            <span className="text-xs line-clamp-1">{streetAddress}</span>
          </div>

          {/* Neighborhood */}
          {venue.neighborhood && (
            <div className="mt-1">
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {venue.neighborhood}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
