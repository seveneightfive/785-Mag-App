import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Music, X, Palette, Mic, BookOpen, Heart } from 'lucide-react'
import { Layout } from '../components/Layout'
import { ArtistCard } from '../components/ArtistCard'
import { useAuth } from '../hooks/useAuth'
import { supabase, type Artist, trackPageView } from '../lib/supabase'

const ARTIST_TYPES = ['Musician', 'Visual', 'Performance', 'Literary']
const MUSICAL_GENRES = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'Country', 'Reggae', 'Blues', 'Folk', 'Singer-Songwriter', 'Spoken Word', 'Motown', 'Funk', 'Americana', 'Punk', 'Grunge', 'Jam Band', 'Tejano', 'Latin', 'DJ']
const VISUAL_MEDIUMS = ['Photography', 'Digital', 'Conceptual', 'Fiber Arts', 'Sculpture / Clay', 'Airbrush / Street / Mural', 'Painting', 'Jewelry', 'Illustration']

export const ArtistsDirectoryPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([])
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedMediums, setSelectedMediums] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [artistsWithEventCounts, setArtistsWithEventCounts] = useState<(Artist & { upcomingEventsCount: number })[]>([])

  useEffect(() => {
    trackPageView('artists-directory')
    fetchArtists()
  }, [])

  useEffect(() => {
    filterArtists()
  }, [artists, artistsWithEventCounts, searchQuery, selectedTypes, selectedGenres, selectedMediums])

  const fetchArtists = async () => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching artists:', error)
    } else {
      const artistsData = data || []
      setArtists(artistsData)
      await fetchUpcomingEventCounts(artistsData)
    }
    setLoading(false)
  }

  const fetchUpcomingEventCounts = async (artistsData: Artist[]) => {
    const artistsWithCounts = await Promise.all(
      artistsData.map(async (artist) => {
        const { count } = await supabase
          .from('event_artists')
          .select('events!inner(start_date)', { count: 'exact', head: true })
          .eq('artist_id', artist.id)
          .gte('events.start_date', new Date().toISOString())

        return {
          ...artist,
          upcomingEventsCount: count || 0
        }
      })
    )
    setArtistsWithEventCounts(artistsWithCounts)
  }

  const filterArtists = () => {
    // Use artists with event counts for filtering and sorting
    let filtered = artistsWithEventCounts.length > 0 ? artistsWithEventCounts : artists.map(artist => ({ ...artist, upcomingEventsCount: 0 }))

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(artist =>
        artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.genre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(artist =>
        selectedTypes.includes(artist.artist_type || 'Musician')
      )
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(artist =>
        artist.musical_genres?.some(genre => selectedGenres.includes(genre))
      )
    }

    // Medium filter
    if (selectedMediums.length > 0) {
      filtered = filtered.filter(artist =>
        artist.visual_mediums?.some(medium => selectedMediums.includes(medium))
      )
    }

    // Sort by upcoming events count (descending), then by name (ascending)
    filtered.sort((a, b) => {
      if (b.upcomingEventsCount !== a.upcomingEventsCount) {
        return b.upcomingEventsCount - a.upcomingEventsCount
      }
      return a.name.localeCompare(b.name)
    })

    setFilteredArtists(filtered)
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
    
    // Clear secondary filters when changing artist type
    if (!selectedTypes.includes(type)) {
      if (type === 'Musician') {
        setSelectedGenres([])
      } else if (type === 'Visual') {
        setSelectedMediums([])
      }
    }
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
  }

  const toggleMedium = (medium: string) => {
    setSelectedMediums(prev =>
      prev.includes(medium)
        ? prev.filter(m => m !== medium)
        : [...prev, medium]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setSelectedGenres([])
    setSelectedMediums([])
    setSearchQuery('')
  }

  const activeFiltersCount = selectedTypes.length + selectedGenres.length + selectedMediums.length

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
                  placeholder="Search artists..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg flex-shrink-0"
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
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {/* Artist Types Filter */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3">Artist Type</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {ARTIST_TYPES.map((type) => (
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

                {/* Musical Genres Filter */}
                {selectedTypes.includes('Musician') && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">Musical Genres</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {MUSICAL_GENRES.map((genre) => (
                        <button
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          className={`btn-filter transition-colors text-xs ${
                            selectedGenres.includes(genre)
                              ? 'active'
                              : ''
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Mediums Filter */}
                {selectedTypes.includes('Visual') && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">Visual Mediums</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {VISUAL_MEDIUMS.map((medium) => (
                        <button
                          key={medium}
                          onClick={() => toggleMedium(medium)}
                          className={`btn-filter transition-colors text-xs ${
                            selectedMediums.includes(medium)
                              ? 'active'
                              : ''
                          }`}
                        >
                          {medium}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layout - Sidebar + Content */}
        <div className="hidden lg:flex h-screen">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Header with Search and Clear */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold font-urbanist text-gray-900 mb-2 uppercase">ARTIST DIRECTORY</h1>
                <p className="text-sm text-gray-600 mb-4">Discover amazing local artists</p>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search artists..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <h3 className="font-bold font-urbanist text-gray-900 text-base">FILTERS</h3>
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Artist Types Filter */}
              <div className="mb-6">
                <h4 className="font-bold font-urbanist text-gray-900 mb-3 text-sm">ARTIST TYPE</h4>
                <div className="space-y-2">
                  {ARTIST_TYPES.map((type) => (
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

              {/* Musical Genres Filter */}
              {selectedTypes.includes('Musician') && (
                <div className="mb-6">
                  <h4 className="font-bold font-urbanist text-gray-900 mb-3 text-sm">MUSICAL GENRES</h4>
                  <div className="space-y-2">
                    {MUSICAL_GENRES.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedGenres.includes(genre)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Mediums Filter */}
              {selectedTypes.includes('Visual') && (
                <div className="mb-6">
                  <h4 className="font-bold font-urbanist text-gray-900 mb-3 text-sm">VISUAL MEDIUMS</h4>
                  <div className="space-y-2">
                    {VISUAL_MEDIUMS.map((medium) => (
                      <button
                        key={medium}
                        onClick={() => toggleMedium(medium)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedMediums.includes(medium)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {medium}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6">
              {/* Results Count */}
              <div className="mb-4">
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${filteredArtists.length} artist${filteredArtists.length !== 1 ? 's' : ''} found`}
                </p>
              </div>

              {/* Artists Grid */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <>
                  {filteredArtists.length > 0 ? (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredArtists.map((artist) => (
                        <ArtistCard key={artist.id} artist={artist} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Music size={48} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No artists found</h3>
                      <p className="text-gray-600">Try adjusting your search or filters</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout - List Cards */}
        <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-3 pb-24">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredArtists.length > 0 ? (
              filteredArtists.map((artist) => (
                <MobileArtistCard key={artist.id} artist={artist} />
              ))
            ) : (
              <div className="text-center py-12">
                <Music size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No artists found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Mobile Artist Card Component with horizontal layout
const MobileArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => {
  const { user } = useAuth()
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    fetchUpcomingEventsCount()
    if (user) {
      checkFollowStatus()
    }
  }, [artist.id])

  useEffect(() => {
    if (user) {
      checkFollowStatus()
    } else {
      setIsFollowing(false)
    }
  }, [user])
  const fetchUpcomingEventsCount = async () => {
    const { count } = await supabase
      .from('event_artists')
      .select('events!inner(start_date)', { count: 'exact', head: true })
      .eq('artist_id', artist.id)
      .gte('events.start_date', new Date().toISOString())

    setUpcomingEventsCount(count || 0)
  }

  const checkFollowStatus = async () => {
    if (!user) return

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('entity_type', 'artist')
      .eq('entity_id', artist.id)
      .maybeSingle()

    setIsFollowing(!!data)
  }

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('entity_type', 'artist')
          .eq('entity_id', artist.id)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            entity_type: 'artist',
            entity_id: artist.id
          })
      }
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('Error following artist:', error)
    } finally {
      setFollowLoading(false)
    }
  }
  const getArtistTypeIcon = (type: string) => {
    switch (type) {
      case 'Musician':
        return <Music size={16} />
      case 'Visual':
        return <Palette size={16} />
      case 'Performance':
        return <Mic size={16} />
      case 'Literary':
        return <BookOpen size={16} />
      default:
        return <Music size={16} />
    }
  }

  return (
    <Link 
      to={`/artists/${artist.slug}`}
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
        {/* Artist Image */}
        <div className="w-20 h-20 bg-gray-200 overflow-hidden flex-shrink-0">
          {artist.image_url || artist.avatar_url ? (
            <img
              src={artist.image_url || artist.avatar_url}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
              {getArtistTypeIcon(artist.artist_type || 'Musician')}
            </div>
          )}
        </div>

        {/* Artist Details */}
        <div className="flex-1 p-3 min-w-0">
          {/* Artist Name */}
          <h3 className="font-urbanist text-base font-medium text-gray-900 mb-1 line-clamp-1 uppercase tracking-wide">
            {artist.name.toUpperCase()}
          </h3>

          {/* Artist Type */}
          <div className="text-xs text-gray-600 mb-2">
            {artist.artist_type || 'Musician'}
          </div>

          {/* Genres/Mediums */}
          {artist.musical_genres && artist.musical_genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {artist.musical_genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-1.5 py-0.5 rounded-full bg-black text-white"
                >
                  {genre}
                </span>
              ))}
              {artist.musical_genres.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{artist.musical_genres.length - 2}
                </span>
              )}
            </div>
          )}

          {artist.visual_mediums && artist.visual_mediums.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {artist.visual_mediums.slice(0, 2).map((medium) => (
                <span
                  key={medium}
                  className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800"
                >
                  {medium}
                </span>
              ))}
              {artist.visual_mediums.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{artist.visual_mediums.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Follow Button */}
        {user && (
          <div className="flex items-center pr-3">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`p-2 rounded-full transition-colors ${
                isFollowing 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-400 hover:text-red-500'
              } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isFollowing ? 'Unfollow artist' : 'Follow artist'}
            >
              <Heart size={14} fill={isFollowing ? 'currentColor' : 'none'} />
            </button>
          </div>
        )}
      </div>
    </Link>
  )
}