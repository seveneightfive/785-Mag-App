import React, { useState, useEffect } from 'react'
import { Search, Filter, MapPin, X, ArrowUpDown, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { VenueCard } from '../components/VenueCard'
import { supabase, type Venue, trackPageView } from '../lib/supabase'

const VENUE_TYPES = ['Art Gallery', 'Live Music', 'Bar/Tavern', 'Retail', 'Restaurant', 'Event Space', 'Brewery/Winery', 'Outdoor Space', 'Theatre', 'Studio/Class', 'Community Space', 'First Friday ArtWalk', 'Coffee Shop', 'Church', 'Experiences', 'Trades + Services']
const NEIGHBORHOODS = ['Downtown', 'NOTO', 'North Topeka', 'Oakland', 'Westboro Mart', 'College Hill', 'Lake Shawnee', 'Golden Mile', 'A Short Drive', 'South Topeka', 'Midtown', 'West Topeka']

type SortOption = 'alphabetical-asc' | 'alphabetical-desc' | 'events-desc'
type FilterStep = 'main' | 'venue-types' | 'neighborhoods'

export const VenuesDirectoryPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([])
  const [venuesWithEventCounts, setVenuesWithEventCounts] = useState<(Venue & { eventCount: number })[]>([])
  const [loading, setLoading] = useState(true)
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
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching venues:', error)
    } else {
      const venuesData = data || []
      setVenues(venuesData)
      await fetchEventCounts(venuesData)
    }
    setLoading(false)
  }

  const fetchEventCounts = async (venuesData: Venue[]) => {
    const venuesWithCounts = await Promise.all(
      venuesData.map(async (venue) => {
        const { count } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('venue_id', venue.id)
          .gte('start_date', new Date().toISOString())

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
        venue.address.toLowerCase().includes(searchQuery.toLowerCase())
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
        venue.address.toLowerCase().includes(searchQuery.toLowerCase())
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
        venue.address.toLowerCase().includes(searchQuery.toLowerCase())
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

    // Apply sorting
    const filteredWithCounts = filtered.map(venue => {
      const venueWithCount = venuesWithEventCounts.find(v => v.id === venue.id)
      return {
        ...venue,
        eventCount: venueWithCount?.eventCount || 0
      }
    })

    switch (sortBy) {
      case 'alphabetical-asc':
        filteredWithCounts.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'alphabetical-desc':
        filteredWithCounts.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'events-desc':
        filteredWithCounts.sort((a, b) => {
          if (b.eventCount !== a.eventCount) {
            return b.eventCount - a.eventCount
          }
          return a.name.localeCompare(b.name)
        })
        break
    }

    setFilteredVenues(filtered)
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
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
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

        {/* Desktop Header */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold font-oswald text-gray-900">Venues Directory</h1>
              <p className="text-gray-600 mt-2">Discover amazing local venues</p>
            </div>

            <div className="flex items-center space-x-4 ml-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search venues..."
                  className="w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <X size={16} />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Sidebar + Content */}
        <div className="hidden lg:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-6 bg-white rounded-xl p-6 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold font-oswald text-gray-900 text-xl">FILTERS</h3>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>

              {/* Venue Types Filter */}
              <div className="mb-6">
                <h4 className="font-bold font-oswald text-gray-900 mb-3 text-sm">VENUE TYPES</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {VENUE_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedTypes.includes(type)
                          ? 'bg-black text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{type}</span>
                        <span className="text-xs opacity-75">({venueTypeCounts[type] || 0})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Neighborhoods Filter */}
              <div className="mb-6">
                <h4 className="font-bold font-oswald text-gray-900 mb-3 text-sm">NEIGHBORHOODS</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {NEIGHBORHOODS.map((neighborhood) => (
                    <button
                      key={neighborhood}
                      onClick={() => toggleNeighborhood(neighborhood)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedNeighborhoods.includes(neighborhood)
                          ? 'bg-black text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{neighborhood}</span>
                        <span className="text-xs opacity-75">({neighborhoodCounts[neighborhood] || 0})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 ml-8">
            {/* Results Count */}
            <div className="mb-4">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${filteredVenues.length} venue${filteredVenues.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {/* Venues Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              </div>
            ) : (
              <>
                {filteredVenues.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVenues.map((venue) => (
                      <VenueCard key={venue.id} venue={venue} />
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

        {/* Mobile Layout */}
        <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="pb-24">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              </div>
            ) : filteredVenues.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}